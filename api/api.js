// api.js
const { request } = require('../utils/request'); // 引入request封装的request函数

// 定义所有接口的路由
const api = {
  // 文字对话接口
  textChat: (data) => {
    return request({
      url: '/textchat',  // 接口路径
      method: 'POST',
      data: data,  // 传入的数据
      success(res) {
        console.log('文字对话成功：', res);
      },
      fail(err) {
        console.error('文字对话失败：', err);
      },
    });
  },
  // 获取历史聊天记录接口
  getHistoryChat: (user_name) => {
    return request({
      url: '/getHistoryChat',  // 接口路径
      method: 'POST',
      data: {
        user_name: user_name
      }
    });
  },

  // 评估更新信号（值为 0/1）
  checkEvaluationSignal: (user_name) => {
    return request({
      url: '/checkEvaluationSignal',
      method: 'POST',
      data: { user_name }
    });
  },

  // 初步评估页面
  getAssessmentData: (user_name) => {
    return request({
      url: '/getAssessmentData',
      method: 'POST',
      data: {
        user_name: user_name
      }
    });
  },
  

  // 获取总结弹窗
  getPopupAdvice: (user_name) => {
    return request({
      url: '/getPopupAdvice',
      method: 'POST',
      data: { user_name }
    });
  },
  

  // 获取评估总览内容（跳转页用：分数、量表、总评估等）
  getEvaluationOverview: (user_name) => {
    return request({
      url: '/getEvaluationOverview',
      method: 'POST',
      data: { user_name }
    });
  },

  // 用户登录接口
  login: (user_name, user_password) => {
    return request({
      url: '/login',  // 登录接口路径
      method: 'POST',
      data: {
        user_name: user_name,
        user_password: user_password,
      },
    });
  },

  // 发送验证码接口
  sendVerificationCode: (phoneNumber, flag = 'change') => {
    return request({
      url: '/sendCode',  // 获取验证码的接口路径
      method: 'POST',
      data: {
        phoneNumber: phoneNumber,
        flag: flag,
      },
    });
  },

// 重置密码接口
  esetPassword: (user_id, user_password0, user_code) => {
    return request({
      url: '/change_password',  // 重置密码接口路径
      method: 'POST',
      data: {
        user_id: user_id,
        user_password: user_password0,
        user_code: user_code,
      },
    });
  },

  // 发送
  sendTextChat: (user_name, word, jscode) => {
    return request({
      url: '/textchat',
      method: 'POST',
      data: {
        user_name: user_name,
        text: word,
        jscode: jscode,
      },
    });
  },

  // 安全检测接口
  checkContentSafety: (word, jscode) => {
    return request({
      url: '/text_content_check',
      method: 'POST',
      data: {
        text: word,
        jscode: jscode,
      },
    });
  },

  // 注册接口
  registerUser: (user_id, user_password0, user_code) => {
    return request({
      url: '/register',
      method: 'POST',
      data: {
        user_id: user_id,
        user_password: user_password0,
        user_code: user_code,
      },
    });
  },

  // 添加其他接口时，按照同样的方式添加
};

module.exports = api;
