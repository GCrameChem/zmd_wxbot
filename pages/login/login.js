// pages/login/login.js
// 获取应用实例
var app = getApp()
const api = require('../../api/api');  // 引入api文件
const request = require('../../utils/request');  // 引入request文件
Page({
  /**
   * 页面的初始数据
   */
  data: {
    user_name:"",
    user_password:"",
    show: false,
  },

  onChange_name(event) {
    // event.detail 为当前输入的值
    console.log(event.detail);
    this.setData({
      user_name: event.detail, // 更新用户名数据
    });
  },
  onChange_password(event) {
    // event.detail 为当前输入的值
    console.log(event.detail);
    this.setData({
      user_password: event.detail, // 更新密码数据
    });
  },

  // 获取历史聊天记录------交互接口
  getHistoryChat: function() {
    var that = this;
    api.getHistoryChat({
      user_name: app.globalData.id,  // 传入用户ID
    })
    .then(res => {
      // 处理成功的结果
      if (res.status === 200) {
        app.globalData.chatListData = res.data;  // 将聊天记录存入全局变量
      }
    })
    .catch(err => {
      // 错误已经在request中处理，不需要再次显示toast
      console.error('获取聊天记录失败', err);
    });
  },
  // getHistoryChat: function() {
  //   // 从服务器端获取聊天记录
  //   var that = this;
  //   // 获取历史聊天记录
  //   wx.request({
  //     // url: 'http://192.168.50.225:8080/getHistoryChat', // 服务器接口地址
  //     // url: 'http://172.20.10.4:8080/getHistoryChat',
  //     url: 'http://1.14.92.141:8080/getHistoryChat',
  //     method: 'POST',
  //     data: {
  //       user_name: app.globalData.id,
  //     },
  //     header: {
  //       'content-type': 'application/json' 
  //     },
  //     success: (res) => {
  //       if (res.data.status === 200) {
  //         app.globalData.chatListData = res.data.data
  //       }
  //       else {
  //         wx.showToast({
  //           title: '网络请求失败，请稍后重试',
  //           icon: 'none'
  //         })
  //       }
  //     },
  //     fail: (err) => {
  //       console.error('获取聊天记录失败', err);
  //       wx.showToast({
  //         title: '网络请求失败，请稍后重试',
  //         icon: 'none'
  //       })
  //     }
  //   });
  // },


  login: function () {
    const that = this;
    // 获取用户名和密码
    const { user_name, user_password } = this.data;
    // 调用登录接口
    api.login(user_name, user_password)
      .then(res => {
        if (res.status === 200) {
          console.log("登录成功");
          // 获取登录状态
          const flag = res.success;
          // 存储用户ID
          app.globalData.id = user_name;
          // 调用获取历史聊天记录接口
          return api.getHistoryChat(app.globalData.id);
        } else if (res.status === 500) {
          // 登录失败
          wx.showToast({
            title: '用户名或密码错误，请重新输入',
            icon: 'none',
          });
          return Promise.reject('用户名或密码错误');
        } else {
          // 网络请求失败
          wx.showToast({
            title: '网络请求失败，请稍后重试',
            icon: 'none',
          });
          return Promise.reject('网络请求失败');
        }
      })
      .then(res => {
        if (res.status === 200) {
          let chatListData = res.data;
          const flag = res.success;
          // 如果是新的一天，推送欢迎消息
          if (flag === 1) {
            chatListData.push({
              'type': 'text',
              'content': "欢迎回来，盼达我一直在等你呢，我们接着聊天吧！",
              'url': null,
              'second': null,
              'time': new Date().getTime(),
              'role': 'assistant',
            });
          }
          // 存储聊天记录
          app.globalData.chatListData = chatListData;
          // 跳转到聊天页面
          wx.redirectTo({
            url: '/pages/chat/chat',
          });
        }
      })
      .catch(err => {
        // 错误处理，自动显示toast
        console.error('登录或获取聊天记录失败', err);
      });
  },
  // login: function () {
  //   // 后端确认该用户信息是否正确
  //   console.log("Sending data:", this.data.user_name, this.data.user_password);
  //   app.globalData.id = this.data.user_name;
  //   wx.request({
  //     // url: 'http://192.168.50.225:8080/login', //后端接口1-----确认用户身份
  //     // url: 'http://172.20.10.4:8080/login',
  //     url: 'http://1.14.92.141:8080/login',
  //     method: 'POST',
  //     data: {
  //       user_name: this.data.user_name,
  //       user_password: this.data.user_password
  //     },
  //     header: {
  //       'content-type': 'application/json'
  //     },
  //     success: function (res) {
  //       console.log(res.data)
  //       // 登录成功
  //       if (res.data.status==200) {
  //         console.log("nihao")
  //         // 通过success来看新的一天与否
  //         let flag = res.data.success
  //         // 登陆成功，加载历史聊天记录
  //         wx.request({
  //           // url: 'http://192.168.50.225:8080/getHistoryChat', // 服务器接口地址
  //           // url: 'http://172.20.10.4:8080/getHistoryChat',
  //           url: 'http://1.14.92.141:8080/getHistoryChat',
  //           method: 'POST',
  //           data: {
  //             user_name: app.globalData.id,
  //           },
  //           header: {
  //             'content-type': 'application/json' 
  //           },
  //           success: (res) => {
  //             console.log(res.data)
  //             if (res.data.status === 200) {
  //               let chatListData = res.data.data;
  //               // 判断是否需要添加“欢迎回来”
  //               // 不是新的一天
  //               if(flag==1) {
  //                 chatListData.push({
  //                   'type': 'text',
  //                   'content': "欢迎回来，盼达我一直在等你呢，我们接着聊天吧！",
  //                   'url': null,
  //                   'second': null,
  //                   'time': new Date().getTime(),
  //                   'role': 'assistant',
  //                 })
  //               } 
  //               // 遍历 chatListData，添加 isPlaying 字段
  //               // if(chatListData.length>0) {
  //               //   // chatListData.forEach(chat => {
  //               //   //   chat.isPlaying = false;
  //               //   });
  //               // }
  //               app.globalData.chatListData = chatListData;
  //               // 登录成功，跳转到对话页面
  //               wx.redirectTo({
  //                 url: '/pages/chat/chat',
  //               });
  //             }
  //           },
  //           fail: (err) => {
  //             console.log(err)
  //             // 提示用户有问题
  //             wx.showToast({
  //               title: '网络请求失败，请稍后重试',
  //               icon: 'none'
  //             })
  //           }
  //         });
  //       }
  //       else if (res.data.status==500) {
  //         // 登录失败，提示用户错误信息
  //         wx.showToast({
  //           title: '用户名或密码错误，请重新输入',
  //           icon: 'none'
  //         })
  //       }
  //       else {
  //         // 提示用户有问题
  //         wx.showToast({
  //           title: '网络请求失败，请稍后重试',
  //           icon: 'none'
  //         })
  //       }
  //     },
  //     fail: function (res) {
  //       console.log(res.data)
  //       // 提示用户有问题
  //       wx.showToast({
  //         title: '网络请求失败，请稍后重试',
  //         icon: 'none'
  //       })
  //     }
  //   })
  // },


  register: function() {
    // 点击注册，直接跳转到注册页面
    wx.redirectTo({
      url: '/pages/register/register',
    })
  },
  change_password: function() {
    // 点击注册，直接跳转到注册页面
    wx.redirectTo({
      url: '/pages/change/change',
    })
  },
  instruction: function() {
    console.log("点击帮助")
    // 点击出现遮罩层
    this.setData({
      show: true
    })
  },
  onClose: function() {
    // 关闭遮罩层
    this.setData({ show: false });
  }

})