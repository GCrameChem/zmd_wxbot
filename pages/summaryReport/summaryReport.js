const api = require('../../api/api');  // 引入api文件
var chatapp = getApp();
Page({
  data: {
    summaryData: {
      summary: '',
      keywords: [],
      issues: '',
      suggestions: ''
    },
    userName : chatapp.globalData.id,
  },

  onLoad: function () {
    this.loadDataFromCacheOrDefault(); // 尝试加载缓存
    this.fetchSummaryData();           // 无论如何尝试更新数据
  },

  // 加载缓存或默认数据
  loadDataFromCacheOrDefault() {
    const key = `summaryReport_${this.data.userName}`;
    const cached = wx.getStorageSync(key);

    if (cached) {
      this.setData({ summaryData: cached });
    }
  },

  // 获取阶段总结数据
  fetchSummaryData() {
    api.getSummaryReport(this.data.userName)
      .then(data => {
        // 处理 keywords：支持英文分号 ; 和中文分号 ；
        if (typeof data.data.keywords === 'string') {
          const normalized = data.data.keywords.replace(/；/g, ';');
          data.data.keywords = normalized.split(';').map(item => item.trim()).filter(item => item);
        }
  
        // 处理 main_problems：按分号切分并加换行
        if (typeof data.data.main_problems === 'string') {
          const normalized = data.data.main_problems.replace(/；/g, ';');
          data.data.main_problems = normalized.split(';')
            .map(item => item.trim())
            .filter(item => item)
            .join('；\n');
        }
  
        this.setData({ summaryData: data.data });
  
        // 缓存写入
        const key = `summaryReport_${this.data.userName}`;
        wx.setStorageSync(key, data);
      });
  }  
});
