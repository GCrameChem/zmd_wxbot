const api = require('../../api/api');  // 引入api文件
const request = require('../../utils/request');  // 引入request文件

// 当前页面对象
let MyPage;
var chatListData = [];
var that
// 定义计时器变量---控制语音输入的时长和触发快结束提示
let countdownTimer, stopRecordingTimer;
var chatapp = getApp();
Page({
  /**
   * 页面的初始数据
   */
  data: {
    isWaitReply: false,
    recordStatus: false,
    innerAudioContext: null, // 录音播放器
    recorderManager: null, // 录音管理器
    currentPlayIndex: -1, // 当前正在播放的录音index
    askWord: '',
    sendButtDisable: true,
    chatList: [],
    scrolltop: '',
    keyboard: false, // 文字输入或语音输入flag-----初始为文字输入
    filePath: null,
    recordPath: '',
    tempsecond: 0,
    startPoint: { clientY: 0 },
    isCancel: false,
    countdown: 5, // 退出倒计时秒数
    // 文本安全检测jscode
    jscode: null,
  },

  // 页面生命周期函数----加载识别
  onLoad: function () {
    chatListData = chatapp.globalData.chatListData;
    // console.log("加载聊天记录", chatListData)
    var charlenght = chatListData.length - 1;
    this.setData({
      chatList: chatListData,
      scrolltop: "roll" + charlenght,
    });
    // 页面加载时初始化录音管理器
    this.initRecord();
    // 页面加载时初始化播放器
    this.initAudio();
  },
  
  //初始化录音管理器---主要设置了onstop函数
  initRecord: function () {
    this.data.recorderManager = wx.getRecorderManager();
    const recorderManager = this.data.recorderManager;
    that = this
     // 录音结束事件
     recorderManager.onStop ((res) => {
      if(that.data.isCancel){
        return
      }
      console.log("录音时长（毫秒）：", res.duration);
      let durationInSeconds = Math.floor(res.duration / 1000); // 转换为秒, 取整
      if (durationInSeconds < 1) {
        wx.showToast({
          title: '说话时间太短',
          icon: 'none',
          duration: 2000
        });
        // this.setData({
        //   recordStatus: false,
        //   isWaitReply: false,
        // });
        return;
      }
      // 如果取整后的值小于60，加一
      if (durationInSeconds < 60) {
        durationInSeconds += 1;
      }
      // console.log("录音时长（秒）：", durationInSeconds);
      that.setData({
        recordPath: res.tempFilePath,
      });
      // 增加语音聊天记录-----------因为此时刚结束录音，因此录音文件保存在本地
      // 当录音文件传入后端保存在服务器上之后，录音文件的url变成服务器上保存的url
      that.addChatWithFlag('voice', null, res.tempFilePath, durationInSeconds, 'user', false, true)
      that.setData({
        tempsecond: durationInSeconds,
      });
      // 调用上传录音文件函数
      console.log("调用上传录音文件函数")
      that.uploadRecording(res.tempFilePath);
    });

    // 录音错误事件
    recorderManager.onError ((err) => {
      console.error(err);
      // 提醒用户录音失败
      wx.showToast({
        title:'语音输入错误'
      });
      this.setData({
        recordStatus: false,
        isWaitReply: false,
      });
    });
  },

  // 初始化播放器
  initAudio: function() {
    this.data.innerAudioContext = wx.createInnerAudioContext();
    // 设置播放结束监听器
    const innerAudioContext = this.data.innerAudioContext;
    const that = this; // 保存当前上下文
    // 设置静音模式下的播放选项
    wx.setInnerAudioOption({
      obeyMuteSwitch: false,
      success: function (res) {
        console.log("开启静音模式下播放音频的功能");
      },
      fail: function (err) {
        console.log("设置静音模式下播放音频的功能失败", err);
      },
    });
    // 监测播放结束
    innerAudioContext.onEnded(() => {
      console.log("播放自动结束");
      const tempIndex = that.data.currentPlayIndex;
      console.log(tempIndex);
      innerAudioContext.stop();
      that.setData({
        [`chatList[${tempIndex}].isPlaying`]: false,
        currentPlayIndex: -1, // 重置当前播放索引
      });
    });
  },

  // 当天对话结束的强制退出功能
  handleEndOfConversation: function() {
    let countdownTime = this.data.countdown; // 使用一个局部变量来保存倒计时秒数
    const countdownInterval = setInterval(() => {
      countdownTime -= 1; // 每次减少1秒
      wx.showModal({
        title: '对话结束',
        content: `今天对话结束，即将自动退出小程序。还有 ${countdownTime} 秒`,
        showCancel: false, // 不显示取消按钮
        success: (res) => {
          if (res.confirm) {
            clearInterval(countdownInterval); // 如果用户确认则清除倒计时
            wx.exitMiniProgram(); // 退出小程序
          }
        }
      });
      if (countdownTime <= 0) {
        clearInterval(countdownInterval);
        wx.exitMiniProgram(); // 退出小程序
      }
    }, 1000); // 每秒更新
  },

  // 切换语音输入和文字输入
  switchInputType: function () {
    this.setData({
      keyboard: !(this.data.keyboard),
    })
  },

  // 处理文字输入框的输入
  handleInput: function (e) {
    // 获取输入框的值
    const value = e.detail.value;
    console.log(value)
    // 更新页面数据中的 askWord
    this.setData({
      askWord: value
    });
  },

  // 对话方式一 —— 文字版-----发送文字，并将文字发送到后台处理
  sendChat: function () {
    const that = this;
    if (that.data.isWaitReply) {
      return;
    }

    const word = that.data.askWord; // 等于输入框中的文字内容
    if (word.length === 0 || word === null) { // 检查用户输入内容是否为空
      return;
    }

    that.data.isWaitReply = true; // 标记为正在等待回复，前端不会再次触发发送请求
    that.addChatWithFlag('text', word, null, 0, 'user', false, true); // 增加内容，显示用户消息

    that.setData({
      askWord: '',
      sendButtDisable: true, // 在消息发送过程中，禁用发送按钮，防止用户连续点击
    });

    // 获取 jscode
    wx.login({
      success: (res) => {
        if (res.code) {
          // 通过 wx.login 获取到 jscode，即临时登录凭证，后端通过 jscode 验证用户身份
          console.log("获取到 jscode：", res.code);
          that.setData({
            jscode: res.code,
          });

          // 使用 request.js 来调用文本安全检测
          checkContentSafety(word, res.code).then((res) => {
            console.log("文本检测的信息 res.data.status = ", res.data.status);
            if (res.data.status === 200) {
              // 文本内容合法，继续聊天
              sendTextChat(chatapp.globalData.id, word, that.data.jscode).then((res) => {
                console.log(res.data.data);
                if (res.data.status === 200) {
                  // 正常对话过程
                  that.addChatWithFlag('text', res.data.data, 0, null, "assistant", false, true);
                } else if (res.data.status === 201) {
                  // 达到当天对话上限，对话将要结束
                  that.addChatWithFlag('text', res.data.data, 0, null, "assistant", false, true);
                  that.handleEndOfConversation();
                } else {
                  // 其他异常情况
                  console.log("文字上传成功但出错");
                  console.log('status = ', res.data.status); // 打印 status
                  wx.showModal({
                    title: '提示',
                    content: '文字上传失败，请稍后重新输入1。',
                    showCancel: false,
                    success: function (res) {
                      if (res.confirm) {
                        that.removeLastChat();
                      }
                    }
                  });
                }
              }).catch(() => {
                wx.showModal({
                  title: '提示',
                  content: '文字上传失败，请稍后重新输入2。',
                  showCancel: false,
                  success: function (res) {
                    if (res.confirm) {
                      that.removeLastChat();
                    }
                  }
                });
              });
            } else {
              // 内容不合法
              wx.showToast({
                title: '输入内容不合法',
              });
              that.removeLastChat();
            }
          }).catch(() => {
            wx.showModal({
              title: '提示',
              content: '文字上传失败，请稍后重新输入3。',
              showCancel: false,
              success: function (res) {
                if (res.confirm) {
                  that.removeLastChat();
                }
              }
            });
          });
        } else {
          // 提示用户有问题
          wx.showToast({
            title: '网络请求失败，请稍后重试',
            icon: 'none'
          });
        }
      },
      fail: function (err) {
        console.error('wx.login 调用失败', err);
        // 提示用户有问题
        wx.showToast({
          title: '网络请求失败，请稍后重试',
          icon: 'none'
        });
      }
    });
  },
  // sendChat: function () {
  //   // 放置作用域改变
  //   that = this;
  //   if(that.data.isWaitReply) {
  //     return
  //   }
  //   let word = that.data.askWord; // 等于输入框中的文字内容
  //   if(word.length==0 || word==null){ // 检查用户输入内容是否为空
  //     return
  //   }
  //   that.data.isWaitReply = true; // 标记为正在等待回复，前端不会再次触发发送请求
  //   that.addChatWithFlag('text', word, null, 0, 'user', false, true); // 增加内容，显示用户消息
  //   that.setData({
  //     askWord: '',
  //     sendButtDisable: true,  // 在消息发送过程中，禁用发送按钮，防止用户连续点击
  //   });
  //   // 获取jscode
  //   wx.login({
  //     success: (res)=> { 
  //       if(res.code) {
  //         // 通过wx.login获取到jscode，即临时登录凭证，后端通过jscode验证用户身份
  //         console.log("获取到jscode：", res.code);
  //         that.setData({
  //           jscode: res.code,
  //         });
  //         // 文字输入
  //         // ------文本安全检测-------
  //         wx.request({
  //           // url: 'https://yunxig.cn/text_content_check',
  //           // url: 'http://192.168.50.225:8080/text_content_check',
  //           // url: 'http://172.20.10.4:8080/text_content_check',
  //           url: 'http://1.14.92.141:8080/text_content_check',
  //           method: "POST",
  //           data: JSON.stringify({  // 确保将数据序列化为 JSON 字符串
  //             text: word,
  //             jscode: res.code,
  //           }), // 向后端发送第一条请求，对输入的文本内容进行安全检测
  //           header: {
  //             'content-type': 'application/json; charset=utf-8'
  //           },
            
  //           success:function(res) {
  //             console.log("文本检测的信息res.data.status = ",res.data.status)
  //             // 文本内容合法
  //             if(res.data.status===200) { //hongze modified === to ==
  //               // ----------------文字对话接口-----------------

  //               wx.request({
  //                   // url: "https://yunxig.cn/textchat", // 后端地址
  //                   // url: "http://192.168.50.225:8080/textchat",
  //                   // url: "http://172.20.10.4:8080/textchat",
  //                   url: "http://1.14.92.141:8080/textchat",
  //                   method: "POST",
  //                   data: {
  //                     user_name: chatapp.globalData.id,
  //                     text: word,
  //                     jscode: that.data.jscode, //hongze add, or res.code
  //                   },
  //                   header: {
  //                     'content-type': 'application/json; charset=utf-8' // 请求头json格式, hongze add ; charset=utf-8
  //                   },// 若文本内容合法，向后端发送第二条请求，即文本聊天交互。
  //                 success: function (res) {
  //                   console.log(res.data.data)
  //                   // -----------------正常对话过程-----------
  //                   if(res.data.status==200) {
  //                     // 增加对话内容
  //                     that.addChatWithFlag('text', res.data.data, 0, null, "assistant", false, true)
  //                   } 
  //                   // ------------------达到当天对话上限，对话将要结束---------
  //                   else if (res.data.status==201) {
  //                     // 增加对话内容
  //                     that.addChatWithFlag('text', res.data.data, 0, null, "assistant", false, true)
  //                     // 强制退出设置
  //                     that.handleEndOfConversation();
  //                   }
  //                   // ----------------其他异常情况-------
  //                   else {
  //                     console.log("文字上传成功但出错")
  //                     console.log('status = ', res.data.status); // hongze add
  //                     wx.showModal({
  //                       title: '提示',
  //                       content: '文字上传失败，请稍后重新输入1。', // 当文本安全检测接口请求失败时触发
  //                       showCancel: false,
  //                       success: function (res) {
  //                         if (res.confirm) {
  //                           // 用户点击确认后执行
  //                           that.removeLastChat();
  //                         }
  //                       }
  //                     });
  //                   }
  //                 },
  //                 fail: function (res) {
  //                   wx.showModal({
  //                     title: '提示',
  //                     content: '文字上传失败，请稍后重新输入2。',
  //                     showCancel: false,
  //                     success: function (res) {
  //                       if (res.confirm) {
  //                         // 用户点击确认后执行
  //                         that.removeLastChat();
  //                       }
  //                     }
  //                   });
  //                 }
  //               })
  //             }
  //             // 内容不合法
  //             else {
  //               // 提示用户输入不合法，需要重新输入
  //               wx.showToast({
  //                 title: '输入内容不合法',
  //               });
  //               // 删除小程序上有关内容
  //               that.removeLastChat();
  //             }  
  //           },
  //           fail:function() {
  //             console.log("安全检测接口出错")
  //             wx.showModal({
  //               title: '提示',
  //               content: '文字上传失败，请稍后重新输入3。', // 当 文字上传到后端进行对话请求 失败时触发。
  //               showCancel: false,
  //               success: function (res) {
  //                 if (res.confirm) {
  //                   // 用户点击确认后执行
  //                   that.removeLastChat();
  //                 }
  //               }
  //             });
  //           },
  //           complete: function() {
  //             that.data.isWaitReply = false;
  //           }
  //         });
  //       }
  //       else {
  //         // 提示用户有问题
  //         wx.showToast({
  //           title: '网络请求失败，请稍后重试',
  //           icon: 'none'
  //         })
  //       }
  //     }, 
  //     fail:function (err) {
  //       console.error('wx.login调用失败', err);
  //       // 提示用户有问题
  //       wx.showToast({
  //         title: '网络请求失败，请稍后重试',
  //         icon: 'none'
  //       })
  //     }
  //   })

  // },

  // 对话录音开始功能 —— 按下录音按钮
  touchdown: function (e) {
    // 没有回复之前不能再次发语音
    if(this.data.isWaitReply || this.data.recordStatus) {
      return;
    }
    // 先清除之前的计时器，避免冲突
    clearTimeout(stopRecordingTimer);
    var recorderManager = this.data.recorderManager;
    // // 暂停正在播放的所有语音 
    // this.innerAudioContext.stop();
    this.setData({
      recordStatus: true,
      isCancel: false,
      startPoint: e.touches[0], //记录触摸点的坐标信息
    });
    // 开始录音
    recorderManager.start({
      // 限制录音时长
      duration: 60000, // 设置录音时长为60秒
      sampleRate: 16000,
      numberOfChannels: 1,
      format: "wav"
    })
    console.log("nihao");
    console.log("录音开始!");
    // // 设置55秒后的提示计时器
    // countdownTimer = setTimeout(() => {
    //   wx.showToast({
    //     title: '录音即将结束',
    //     duration: 2000
    //   });
    // }, 55000);
    // 设置60秒后自动停止录音的计时器
    stopRecordingTimer = setTimeout(() => {
      that.setData({
        recordStatus: false,
        isWaitReply: true,
      });
      recorderManager.stop();
      console.log("录音自动结束!");
    }, 60000);
  },

  // 对话录音结束功能 —— 松开录音按钮
  touchup: function (e) {
     // 清除计时器
    //  clearTimeout(countdownTimer);
     clearTimeout(stopRecordingTimer);
    // 没有回复之前不能再次发语音
    if(this.data.isWaitReply) {
      return;
    }
    var recorderManager = this.data.recorderManager;
    if (!this.data.recordStatus) {
      return;
    }
    this.setData({
      isWaitReply: true,
      recordStatus: false,
    })
    // 录音结束时触发 
    console.log("调用stop")
    recorderManager.stop();
    console.log("录音结束!");
    console.log(this.data.isWaitReply);
    console.log(this.data.recordStatus);
  },

  // 滑动取消录音
  cancelRecorderManager:function(e){
    if(this.data.isWaitReply) {
      return;
    }
    if (!this.data.recordStatus) {
      return;
    }
    var recorderManager = this.data.recorderManager;
    //计算距离，当滑动的垂直距离大于25时，则取消发送语音
    if (Math.abs(e.touches[e.touches.length - 1].clientY - this.data.startPoint.clientY)>25){
      //取消滑动 - 不发送消息
      console.log('cancel')
      this.setData({
        recordStatus: false,
        isCancel: true,
      });
      recorderManager.stop();
      // 清除计时器
      // clearTimeout(countdownTimer);
      clearTimeout(stopRecordingTimer);
    }
  },

  // 对话方式二 —— 语音版-----上传录音文件到服务器----
  uploadRecording: function(path) {
    console.log("调用上传录音函数")
    console.log(path)
    wx.uploadFile({
      // url: 'https://yunxig.cn/voiceChat', // 语音对话接口
      // url: 'http://192.168.50.225:8080/voiceChat',
      // url: 'http://172.20.10.4:8080/voiceChat',
      url: 'http://1.14.92.141:8080/voiceChat',
      filePath: path,
      name: 'voiceFile',
      formData: { 
        filePath: path, 
        user_name: chatapp.globalData.id, 
        second: this.data.tempsecond,
      },

      success: (res) => {
        const obj = JSON.parse(res.data)
        console.log("报错信息", obj.status)
        // -----------语音上传失败------------
        if (obj.status !==201 && obj.status!==200) {

          wx.showModal({
            title: '提示',
            content: '语音上传失败',
            showCancel: false,
            success: function (res) {
              if (res.confirm) {
                // 用户点击确认后执行
                that.removeLastChat();
              }
            }
          });
        } 
        // -------------对话达到当天的上限----------------
        else if (obj.status === 201) {
          // 增加对话内容
          that.addChatWithFlag('text', res.data.data, 0, null, "assistant", false, true)
          // 强制退出设置
          that.handleEndOfConversation();
        }
        // ---------------正常对话流程------------
        else {
          // 将录音文件的url修改为后端上的url
          console.log(obj.url)
          chatListData[chatListData.length-1]['url'] = obj.url
          this.setData({
            chatList:chatListData,
          });
          // 生成ai的回复加入聊天记录
          this.addChatWithFlag('text', obj.data, 0, null, 'assistant', false, true);
        }
      },
      // 未请求到后端服务器
      fail: (err) => {
        console.log('上传失败', err);
        wx.showModal({
          title: '提示',
          content: '语音上传失败，请重新输入或使用文字输入',
          showCancel: false,
          success: function (res) {
            if (res.confirm) {
              // 用户点击确认后执行
              that.removeLastChat();
            }
          }
        });
      },
      complete: () => {
        // 隐藏加载提示框
        wx.hideLoading();
        this.setData({
          recordStatus: false,
          isWaitReply: false,
        });
      },
    });
  },

  // 增加对话到显示界面（scrolltopFlag为是否滚动标志）
  addChatWithFlag: function (type, text, url, second, role, play, scrolltopFlag) {
    let ch = { 'type': type, 'content': text, 'url': url, 'second': second, 'time': new Date().getTime(), 'role': role, 'isPlaying': play };
    chatListData.push(ch);
    var charlenght = chatListData.length;
    if (scrolltopFlag) {
      that.setData({
        chatList: chatListData,
        scrolltop: "roll" + charlenght,
      });
    } else {
      that.setData({
        chatList: chatListData,
      });
    }
  },

  // 删除最新一条聊天记录
  removeLastChat: function () {
    // 检查是否有聊天记录
    if (chatListData.length > 0) {
      // 删除最后一条记录
      chatListData.pop(); // 移除数组中的最后一个元素
      // 更新界面
      that.setData({
        chatList: chatListData,
        scrolltop: "roll" + chatListData.length, // 更新滚动位置
      });
    } 
  },

  // 播放录音函数--可暂停或播放其他的录音
  playVoice: function(e) {
    that = this
    // 播放按钮上存储了url
    const url = e.currentTarget.dataset.url;
    const index = e.currentTarget.dataset.index;
    // console.log("显示当前播放源");
    // console.log(that.data.innerAudioContext.src);
    const innerAudioContext = that.data.innerAudioContext;
    const playingIndex = that.data.currentPlayIndex; // 当前正在播放的录音索引
    console.log("当前正在播放的", playingIndex)
    // 逻辑理清楚这儿
    if (innerAudioContext) {
      if (playingIndex===-1) {
        // 此时没有播放的和暂停的
        console.log("播放");
        console.log(url);
        that.setData({
          [`chatList[${index}].isPlaying`]: true,
          currentPlayIndex: index,
        });
        innerAudioContext.src = url;
        innerAudioContext.play();
      }
      else {
        if(innerAudioContext.paused) { // 有暂停的
          if(innerAudioContext.src===url) {
            // 点击正在暂停的录音，即继续播放
            console.log("继续播放");
            console.log(url)
            that.setData({
              [`chatList[${index}].isPlaying`]: true,
              currentPlayIndex: index,
            });
            innerAudioContext.play(); // 没有重新设置src，则是继续播放
          } else { // 有一个暂停的录音，但是要播放另一个新的录音
            console.log("播放");
            that.setData({
              [`chatList[${index}].isPlaying`]: true,
              currentPlayIndex: index,
            });
            innerAudioContext.src = url;
            console.log(url)
            innerAudioContext.play();
          }
        } else { // 没有暂停的
          if(innerAudioContext.src===url) {
            // 暂停正在播放的录音
            console.log("暂停");
            console.log(url)
            that.setData({
              [`chatList[${index}].isPlaying`]: false,
              currentPlayIndex: index,
            });
            innerAudioContext.pause();
          } else {
            // 目前正在播放一个录音，但是要播放另一个录音
            console.log("暂停-播放另一个");
            that.setData({
              [`chatList[${index}].isPlaying`]: true,
              [`chatList[${playingIndex}].isPlaying`]: false,
              currentPlayIndex: index,
            });
            console.log(url)
            innerAudioContext.src = url;
            innerAudioContext.play();
          }
        }
      }
    } else {
      console.error("innerAudioContext 播放器未初始化");
    }
  },
})
