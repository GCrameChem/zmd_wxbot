// request.js
const config = require('../config');  // 引入config文件，获取 base_url 配置

/**
 * 封装 wx.request 请求
 * @param {Object} options 请求的配置参数
 */
function request(options) {
  const { url, method = 'GET', data = {}, header = {}, success, fail, complete } = options;

  // 请求的url应该拼接在base_url后
  const fullUrl = config.base_url + url;

  // 打印请求的配置
  console.log('Request:', {
    url: fullUrl,
    method: method,
    data: data,
    headers: {
      'content-type': 'application/json',
      ...header,  // 合并传入的header
    },
  });

  return new Promise((resolve, reject) => {
    wx.request({
      url: fullUrl,
      method: method,
      data: data,
      header: {
        'content-type': 'application/json',
        ...header,  // 合并传入的header
      },
      // success(res) {
      //   // 打印响应数据
      //   console.log('Response:', {
      //     statusCode: res.statusCode,
      //     data: res.data,
      //   });

      //   if (res.statusCode === 200) {
      //     if (res.status === 200) {
      //       // 成功回调
      //       success && success(res.data);
      //       resolve(res.data);
      //     } else {
      //       // 处理失败状态
      //       wx.showToast({
      //         title: '请求失败，请稍后重试。',
      //         icon: 'none',
      //       });
      //       reject(res.data);
      //     }
      //   } else {
      //     // 网络错误等
      //     wx.showToast({
      //       title: '网络请求失败，请检查您的网络。',
      //       icon: 'none',
      //     });
      //     reject(res);
      //   }
      // },
      success(res) {
        console.log('Response:', {
          statusCode: res.statusCode,
          data: res.data,
        });
      
        // 尝试修正 data 为 string 或 bytes 情况
        let fixedData = res.data;
      
        // 情况1：后端返回的是字符串（通常是 JSON 字符串）
        if (typeof fixedData === 'string') {
          try {
            fixedData = JSON.parse(fixedData);
          } catch (e) {
            console.warn('响应不是合法 JSON 字符串，内容如下：', fixedData);
            wx.showToast({
              title: '服务器响应格式异常',
              icon: 'none',
            });
            reject(fixedData);
            return;
          }
        }
      
        // 继续之前的逻辑
        if (res.statusCode === 200) {
          if (fixedData.status === 200) {
            success && success(fixedData);
            resolve(fixedData);
          } else {
            wx.showToast({
              title: '请求失败，请稍后重试。',
              icon: 'none',
            });
            reject(fixedData);
          }
        } else {
          wx.showToast({
            title: '网络请求失败，请检查您的网络。',
            icon: 'none',
          });
          reject(res);
        }
      },
      fail(error) {
        // 打印错误
        console.log('Request failed:', error);

        wx.showToast({
          title: '请求出错，请稍后再试。',
          icon: 'none',
        });
        fail && fail(error);
        reject(error);
      },
      complete() {
        complete && complete();
      },
    });
  });
}

module.exports = {
  request,
};
