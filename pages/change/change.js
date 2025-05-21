// pages/register/register.ts
const api = require('../../api/api');  // 引入api文件
const request = require('../../utils/request');  // 引入request文件
Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 身份证号检查
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
  },

  // -------------------注册功能实现-------------------------
  // ------身份证号-------检查
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
  // 发送验证码功能
sendVerificationCode: function() {
  const phoneNumber = this.data.user_id;
  if (this.data.errorMessage_id === '' && phoneNumber !== '') {
    console.log("发送验证码");

    // 调用接口发送验证码
    api.sendVerificationCode(phoneNumber)
      .then(res => {
        if (res.status === 200) {
          // 验证码发送成功，启动倒计时
          this.startCountdown_code();
          this.setData({ errorMessage_code: '' });
        } else {
          this.setData({
            errorMessage_code: '验证码发送失败，请稍后再试',
          });
        }
      })
      .catch(err => {
        // 请求失败时显示错误信息
        this.setData({
          errorMessage_code: '请求失败，请稍后再试',
        });
      });
  }
},
  // sendVerificationCode:function() {
  //   const phoneNumber = this.data.user_id;
  //   if (this.data.errorMessage_id=='' && phoneNumber!='') {
  //     console.log("发送")
  //     // 向后端发送获取验证码的请求
  //     wx.request({
  //       // url: 'https://yunxig.cn/sendCode',  // 你的后端接口地址
  //       // url: 'http://192.168.50.225:8080/sendCode',
  //       // url: 'http://172.20.10.4:8080/sendCode',
  //       url: 'http://1.14.92.141:8080/sendCode',
  //       method: 'POST',
  //       data: {
  //         phoneNumber: phoneNumber, 
  //         flag: 'change'
  //       },
  //       success: (res) => {
  //         if(res.status==200) {
  //           this.startCountdown_code();  // 启动倒计时
  //           this.setData({errorMessage_code: ''});
  //         }
  //         else {
  //           this.setData({
  //             errorMessage_code: '验证码发送失败，请稍后再试',
  //           });
  //         }
  //       },
  //       fail: (err) => {
  //         this.setData({
  //           errorMessage_code: '请求失败，请稍后再试'
  //         });
  //       }
  //     });
  //   }
  // },
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
  // 重置密码功能
reset_password: function() {
  const { user_id, user_password0, user_password1, verfication_code, errorMessage_id, errorMessage_password0, errorMessage_password1, errorMessage_code } = this.data;
  
  // 检查输入是否完成且没有错误
  if (!user_id || !user_password0 || !user_password1 || !verfication_code) {
    this.setData({ errorMessage: '请确保所有输入框都已填写。' });
    return;
  }
  if (errorMessage_id || errorMessage_password0 || errorMessage_password1 || errorMessage_code) {
    this.setData({ errorMessage: '信息未正确，无法重置' });
    return;
  }

  // 信息输入正确，能够进行注册
  this.setData({ errorMessage: '' });

  // 调用重置密码接口
  api.resetPassword(user_id, user_password0, verfication_code)
    .then(res => {
      if (res.status === 200) {
        if (res.success === 1) {
          wx.showModal({
            content: '您未进行注册，请先返回登录页面进行注册',
            showCancel: false,
            confirmText: '返回登录',
            success: function (result) {
              if (result.confirm) {
                wx.redirectTo({
                  url: '/pages/login/login', // 跳转到登录页面
                });
              }
            },
          });
        } else if (res.success === 2) {
          wx.showModal({
            content: '密码重置成功，点击返回登录页面进行登录。',
            showCancel: false,
            confirmText: '返回登录',
            success: function (result) {
              if (result.confirm) {
                wx.redirectTo({
                  url: '/pages/login/login', // 跳转到登录页面
                });
              }
            },
          });
        }
      } else {
        wx.showToast({
          title: '请求失败，请检查网络或稍后再试',
          icon: 'none',
        });
      }
    })
    .catch(err => {
      // 错误处理
      console.error('重置密码失败', err);
      wx.showToast({
        title: '请求失败，请检查网络或稍后再试',
        icon: 'none',
      });
    });
},
  // reset_password:function() {
  //   const { user_id, user_password0, user_password1, verfication_code, errorMessage_id, errorMessage_password0, errorMessage_password1, errorMessage_code } = this.data;
  //   // 检查输入是否完成且没有错误
  //   if (!user_id || !user_password0 || !user_password1 || !verfication_code) {
  //     this.setData({ errorMessage: '请确保所有输入框都已填写。' });
  //     return;
  //   }
  //   if (errorMessage_id || errorMessage_password0 || errorMessage_password1 || errorMessage_code) {
  //     this.setData({ errorMessage: '信息未正确，无法重置' });
  //     return;
  //   }
  //   // 信息输入正确，能够进行注册
  //   this.setData({errorMessage: ''});

  //   // ---------将身份证号和密码传递给后端，便于录入系统--------注册接口
  //   // 后端确认该用户信息是否正确
  //   console.log("Sending data:", this.data.user_id, this.data.user_password0);
  //   wx.request({
  //     // url: 'https://yunxig.cn/change_password', // 后端接口
  //     // url: 'http://192.168.50.225:8080/change_password',
  //     // url: 'http://172.20.10.4:8080/change_password',
  //     url: 'http://1.14.92.141:8080/change_password',
  //     method: 'POST',
  //     data: {
  //       user_id: this.data.user_id, // 传递身份证号
  //       user_password: this.data.user_password0,  // 传递密码
  //       user_code: this.data.verfication_code, // 验证码
  //     },
  //     header: {
  //       'content-type': 'application/json'
  //     },
  //     success: function (res) {
  //       // 处理成功响应
  //       console.log("Response:", res.data);
  //       if (res.status===200) {
  //          // 假设后端返回的成功状态为 1---之前未注册过，0----重置失败，2---之前注册过了，更新密码成功
  //         if (res.success==1) {
  //           wx.showModal({
  //             content: '您未进行注册，请先返回登录页面进行注册',
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
  //         } else if (res.success==2) {
  //           wx.showModal({
  //             content: '密码重置成功，点击返回登录页面进行登录。',
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
  //         }
  //       }
  //       else {
  //         wx.showToast({
  //           title: '请求失败，请检查网络或稍后再试',
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