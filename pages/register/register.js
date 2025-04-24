// pages/register/register.ts
const api = require('../../api/api');  // 引入api文件
const request = require('../../utils/request');  // 引入request文件
Page({
  /**
   * 页面的初始数据
   */
  data: {
    show: true,
    isAgreed: false,
    scrollHeight: 0,
    acceptCountdown: 5,
    // 手机号检查
    user_id: '',
    errorMessage_id: '',
    user_password0: '',
    errorMessage_password0: '',
    user_password1: '', 
    errorMessage_password1: '',
    errorMessage: '',
    // 用户输入的验证码
    verfication_code: '',
    errorMessage_code: '',
    isCodeButtonDisabled: false, 
    timeRemaining: 60, // 倒计时
    timer: null, // 倒计时定时器
  },

  onLoad() {
    this.setData({
      show:true,
      isAgreed:false,
    })
    // console.log('isAgreed:', this.data.isAgreed); // 调试信息
    // this.initScrollHeight();
    // 启动倒计时
    this.startCountdown();
  },

  //---------------------知情同意书阅读功能实现------------------------
  // // 获取初始的高度信息
  // initScrollHeight() {
  //   const query = wx.createSelectorQuery();
  //   query.select('.agreement').boundingClientRect((rect) => {
  //     if (rect) {
  //       this.setData({ scrollHeight: rect.height });
  //     }
  //   }).exec();
  // },

  // 倒计时
  startCountdown: function () {
    let countdown = 5;
    const interval = setInterval(() => {
      countdown--;
      this.setData({
        acceptCountdown: countdown
      });
      if (countdown <= 0) {
        clearInterval(interval);
        this.setData({
          isAgreed: true
        });
      }
    }, 1000);
  },
  noop() {
    // 处理捕获事件，防止点击穿透
  },
  // // 计算是否划到滚动条底部以能获取点击同意的权限
  // onScroll(e) {
  //   const query = wx.createSelectorQuery();
  //   query.select('.agreement').boundingClientRect((rect) => {
  //     if (rect) {
  //       const scrollHeight = e.detail.scrollHeight; // 内容总高度
  //       const clientHeight = rect.height; // 可视区域高度
  
  //       console.log('scrollTop:', e.detail.scrollTop);
  //       console.log('scrollHeight:', scrollHeight);
  //       console.log('clientHeight:', clientHeight);
  
  //       // 判断是否滚动到达底部
  //       if (e.detail.scrollTop + clientHeight >= scrollHeight-5) {
  //         this.setData({ isAgreed: true });
  //         console.log("设置为true");
  //       } else {
  //         this.setData({ isAgreed: false });
  //         console.log("设置为false");
  //       }
  //     }
  //   }).exec();
  // },
  
  // 同意之后，遮罩层消失，进行注册步骤
  onAgree:function() {
    // 处理同意逻辑
    if(this.data.isAgreed) {
      this.setData({ show: false });
    }
  },
  // 取消之后，回到登陆首页，无法进行注册
  onCancel:function() {
    // 处理取消逻辑--返回登陆页面
    wx.redirectTo({
      url: '/pages/login/login',
    })
  },
  // -------------------注册功能实现-------------------------
  // ------手机号-------检查
  onChange_id(e) {
    this.setData({ user_id: e.detail }); // 更新输入值
  },
  onBlur_id() {
    const { user_id } = this.data;
    // 手机号验证逻辑
    const phoneRegex = /^1[3-9]\d{9}$/; // 11位手机号，第一位为1，第二位为3-9的任意数字
    if (user_id === '') {
        this.setData({ errorMessage_id: '' }); // 输入框为空时不显示错误信息
    } else if (!phoneRegex.test(user_id)) {
        this.setData({ errorMessage_id: '手机号格式不正确，请检查' });
    } else {
        this.setData({ errorMessage_id: '' }); // 清除错误信息
    }
  },
  // -------设置密码------检查
  onChange_password0(e) {
    this.setData({ user_password0: e.detail }); // 更新输入值
  },
  onBlur_password0() {
    const { user_password0 } = this.data;
    // 密码验证逻辑（6-12位的大写字母和数字）
    const passwordRegex = /^[A-Za-z\d]{6,12}$/; // 6-12位，大写字母、小写字母和数字的组合
    if (user_password0 === '') {
      this.setData({ errorMessage_password0: '' }); // 输入框为空时不显示错误信息
    } else if (!passwordRegex.test(user_password0)) {
      this.setData({ errorMessage_password0: '密码格式不正确，请使用6-12位的大小写字母和数字' });
    } else {
      this.setData({ errorMessage_password0: '' }); // 清除错误信息
    }
  },
  // -----检查密码是否二次输入正确-----检查
  onChange_password1(e) {
    this.setData({ user_password1: e.detail }); // 更新第二个密码
  },
  onBlur_password1() {
    const { user_password0, user_password1 } = this.data;

    // 检查两个密码是否一致
    if (user_password1 === '') {
      this.setData({ errorMessage_password1: '' }); // 输入框为空时不显示错误信息
    } else if (user_password0 !== user_password1) {
      this.setData({ errorMessage_password1: '两个密码输入不一致，请检查！' });
    } else {
      this.setData({ errorMessage_password1: '' }); // 清除错误信息
    }
  },

  // 验证码输入
  onChange_code(e) {
    this.setData({verfication_code: e.detail}); // 验证码
  },

  // 点击获取验证码
  sendVerificationCode:function() {
    const phoneNumber = this.data.user_id;
    if (this.data.errorMessage_id=='' && phoneNumber!='') {
      console.log("发送")
      // 向后端发送获取验证码的请求
      wx.request({
        // url: 'https://yunxig.cn/sendCode',  // 你的后端接口地址
        // url: 'http://192.168.50.225:8080/sendCode',
        // url: 'http://172.20.10.4:8080/sendCode',
        url: 'http://1.14.92.141:8080/sendCode',
        method: 'POST',
        data: {
          phoneNumber: phoneNumber,
          flag: 'register'
        },
        success: (res) => {
          console.log("看", res.data)
          if(res.data.status==200) {
            this.startCountdown_code();  // 启动倒计时
            this.setData({errorMessage_code: ''});
          } else if (res.data.status==201) {
            wx.showModal({
              title: '重复注册',
              content: '该手机号已经注册过，点击返回登录页面进行登录。',
              showCancel: false, // 不显示取消按钮
              confirmText: '返回登录',
              success: function (result) {
                if (result.confirm) {
                  // 返回登录页面
                  wx.redirectTo({
                    url: '/pages/login/login', // 替换为登录页面的实际路径
                  });
                }
              }
            });
          }
          else {
            this.setData({
              errorMessage_code: '验证码发送失败，请稍后再试',
            });
          }
        },
        fail: (err) => {
          this.setData({
            errorMessage_code: '请求失败，请稍后再试'
          });
        }
      });
    }
  },
  // 启动倒计时函数
  startCountdown_code() {
    this.setData({
      isCodeButtonDisabled: true
    });

    let countdown = this.data.timeRemaining;
    const timer = setInterval(() => {
      countdown--;
      this.setData({
        timeRemaining: countdown
      });

      if (countdown <= 0) {
        clearInterval(timer);
        this.setData({
          isCodeButtonDisabled: false,
          timeRemaining: 60
        });
      }
    }, 1000);

    this.setData({
      timer: timer
    });
  },

  // ---点击注册---实现数据库录入、分配相关信息的功能-------
  register: function () {
    const { user_id, user_password0, user_password1, verfication_code, errorMessage_id, errorMessage_password0, errorMessage_password1, errorMessage_code } = this.data;
  
    // 检查输入是否完成且没有错误
    if (!user_id || !user_password0 || !user_password1 || !verfication_code) {
      this.setData({ errorMessage: '请确保所有输入框都已填写。' });
      return;
    }
    if (errorMessage_id || errorMessage_password0 || errorMessage_password1 || errorMessage_code) {
      this.setData({ errorMessage: '信息未正确，无法注册' });
      return;
    }
  
    // 信息输入正确，能够进行注册
    this.setData({ errorMessage: '' });
  
    // 调用 registerUser 函数进行注册请求
    registerUser(this.data.user_id, this.data.user_password0, this.data.verfication_code)
      .then((res) => {
        // 处理成功响应
        console.log("Response:", res.data);
        if (res.data.status == 200) {
          if (res.data.success == 1) {
            wx.showModal({
              title: '注册成功',
              content: '注册已完成，点击返回登录页面。',
              showCancel: false,
              confirmText: '返回登录',
              success: function (result) {
                if (result.confirm) {
                  // 返回登录页面
                  wx.redirectTo({
                    url: '/pages/login/login',
                  });
                }
              }
            });
          } else if (res.data.success == 2) {
            wx.showModal({
              title: '重复注册',
              content: '该手机号已经注册过，点击返回登录页面进行登录。',
              showCancel: false,
              confirmText: '返回登录',
              success: function (result) {
                if (result.confirm) {
                  wx.redirectTo({
                    url: '/pages/login/login',
                  });
                }
              }
            });
          } else if (res.data.success == 3) {
            wx.showToast({
              title: '验证码已过期，请重试',
              icon: 'none',
            });
          } else if (res.data.success == 4) {
            wx.showToast({
              title: '验证码错误，请稍后重试',
              icon: 'none',
            });
          }
        } else {
          // 注册失败
          wx.showToast({
            title: '注册失败，请重试',
            icon: 'none',
          });
        }
      })
      .catch((error) => {
        // 处理错误
        console.error("Request failed:", error);
      });
  },
  // register:function() {
  //   const { user_id, user_password0, user_password1, verfication_code, errorMessage_id, errorMessage_password0, errorMessage_password1, errorMessage_code } = this.data;
  //   // 检查输入是否完成且没有错误
  //   if (!user_id || !user_password0 || !user_password1 || !verfication_code) {
  //     this.setData({ errorMessage: '请确保所有输入框都已填写。' });
  //     return;
  //   }
  //   if (errorMessage_id || errorMessage_password0 || errorMessage_password1 || errorMessage_code) {
  //     this.setData({ errorMessage: '信息未正确，无法注册' });
  //     return;
  //   }
  //   // 信息输入正确，能够进行注册
  //   this.setData({errorMessage: ''});

  //   // ---------将身份证号和密码传递给后端，便于录入系统--------注册接口
  //   // 后端确认该用户信息是否正确
  //   console.log("Sending data:", this.data.user_id, this.data.user_password0);
  //   wx.request({
  //     // url: 'http://192.168.50.225:8080/register', 
  //     // url: 'http://172.20.10.4:8080/register',
  //     url: 'http://1.14.92.141:8080/register',
  //     // url: 'https://yunxig.cn/register', // 后端接口
  //     method: 'POST',
  //     data: {
  //       user_id: this.data.user_id, // 传递身份证号
  //       user_password: this.data.user_password0, // 传递密码
  //       user_code: this.data.verfication_code, // 传递验证码
  //     },
  //     header: {
  //       'content-type': 'application/json'
  //     },
  //     success: function (res) {
  //       // 处理成功响应
  //       console.log("Response:", res.data);
  //       // 假设后端返回的成功状态为 1---注册成功，0----注册失败，2---已经注册过了
  //       if (res.data.status==200) {
  //         if (res.data.success==1) {
  //           wx.showModal({
  //             title: '注册成功',
  //             content: '注册已完成，点击返回登录页面。',
  //             showCancel: false, // 不显示取消按钮
  //             confirmText: '返回登录',
  //             success: function (result) {
  //               if (result.confirm) {
  //                 // 返回登录页面
  //                 wx.redirectTo({
  //                   url: '/pages/login/login', // 替换为登录页面的实际路径
  //                 });
  //               }
  //             }
  //           });
  //         } else if (res.data.success==2) {
  //           wx.showModal({
  //             title: '重复注册',
  //             content: '该手机号已经注册过，点击返回登录页面进行登录。',
  //             showCancel: false, // 不显示取消按钮
  //             confirmText: '返回登录',
  //             success: function (result) {
  //               if (result.confirm) {
  //                 // 返回登录页面
  //                 wx.redirectTo({
  //                   url: '/pages/login/login', // 替换为登录页面的实际路径
  //                 });
  //               }
  //             }
  //           });
  //         } else if (res.data.success==3) {
  //           wx.showToast({
  //             title: '验证码已过期，请重试',
  //             icon: 'none',
  //           });
  //         } else if(res.data.success==4) {
  //           wx.showToast({
  //             title: '验证码错误，请稍后重试',
  //             icon: 'none',
  //           });
  //         }
  //       }
  //       else {
  //         // 处理注册失败的情况
  //         wx.showToast({
  //           title: '注册失败，请重试',
  //           icon: 'none',
  //         });
  //       }
  //     },
  //     // 前端未能成功与后端建立了联系的报错
  //     fail: function (error) {
  //       // 处理错误
  //       console.error("Request failed:", error);
  //       wx.showToast({
  //         title: '请求失败，请检查网络或稍后再试',
  //         icon: 'none',
  //       });
  //     }
  //   });
  // },
  // 点击返回
  return:function() {
    // 返回登录页面
    wx.redirectTo({
      url: '/pages/login/login', // 替换为登录页面的实际路径
    });
  }
})