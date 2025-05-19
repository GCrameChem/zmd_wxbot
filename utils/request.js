const config = require('../config');  // 引入配置文件

/**
 * 通用请求封装
 * @param {Object} options - 请求配置项
 */
function request(options) {
  const {
    url,
    method = 'GET',
    data = {},
    header = {},
    success,
    fail,
    complete,
  } = options;

  const fullUrl = config.base_url + url;

  console.log('[Request Start]', {
    url: fullUrl,
    method,
    data,
    headers: {
      'content-type': 'application/json',
      ...header,
    },
  });

  return new Promise((resolve, reject) => {
    wx.request({
      url: fullUrl,
      method,
      data,
      header: {
        'content-type': 'application/json',
        ...header,
      },
      success(res) {
        let responseData = res.data;

        // 尝试解析非 JSON 对象类型的响应
        if (typeof responseData === 'string') {
          try {
            responseData = JSON.parse(responseData);
          } catch (e) {
            console.warn('[Warning] 返回内容不是合法 JSON，内容为:', responseData);
            wx.showToast({
              title: '服务器响应格式异常',
              icon: 'none',
            });
            reject({ status: -1, message: 'JSON 解析失败', raw: responseData });
            return;
          }
        }

        // 成功处理
        console.log('[Response OK]', {
          url: fullUrl,
          statusCode: res.statusCode,
          data: responseData,
        });

        if (res.statusCode === 200) {
          if (responseData.status === 200) {
            success && success(responseData);
            resolve(responseData);
          } else {
            // 业务逻辑错误（status ≠ 200）
            wx.showToast({
              title: responseData.message || '请求失败，请稍后重试',
              icon: 'none',
            });
            reject(responseData);
          }
        } else {
          // 非200响应码
          wx.showToast({
            title: '服务器响应失败',
            icon: 'none',
          });
          reject({ status: res.statusCode, message: 'HTTP错误', data: responseData });
        }
      },
      fail(error) {
        console.error('[Network Error]', error);
        wx.showToast({
          title: '网络请求失败，请检查网络',
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
