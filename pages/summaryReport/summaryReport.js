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
        const rawData = data.data;
  
        // keywords 处理
        if (typeof rawData.keywords === 'string') {
          const normalized = rawData.keywords.replace(/；/g, ';');
          rawData.keywords = normalized.split(';').map(item => item.trim()).filter(item => item);
        }
  
        // main_problems 转为 rich-text 格式
        if (typeof rawData.main_problems === 'string') {
          const normalized = rawData.main_problems.replace(/；/g, ';');
          const items = normalized.split(';').map(item => item.trim()).filter(item => item);
          rawData.mainProblemsNodes = items.map(p => ({
            name: 'p',
            attrs: {
              style: 'text-indent:2em; margin-bottom: 20rpx; font-size: 30rpx; line-height: 1.8; color: #333;',
            },
            children: [{
              type: 'text',
              text: p + '；'
            }]
          }));
        }
  
        // suggestions 转为 rich-text 格式
        if (typeof rawData.suggestions === 'string') {
          const normalized = rawData.suggestions.replace(/；/g, ';');
          const items = normalized.split(';').map(item => item.trim()).filter(item => item);
        
          rawData.suggestionNodes = items.map(p => {
            // 查找中文或英文冒号的位置
            const match = p.match(/^(.*?[：:])(.*)$/); // 分为前缀 + 剩余部分
            if (match) {
              return {
                name: 'p',
                attrs: {
                  style: 'text-indent:2em; margin-bottom: 20rpx; font-size: 30rpx; line-height: 1.8; color: #333;',
                },
                children: [
                  {
                    name: 'strong',
                    children: [{ type: 'text', text: match[1] }]
                  },
                  {
                    type: 'text',
                    text: match[2] + '；'
                  }
                ]
              };
            } else {
              // 若无冒号，正常渲染整段
              return {
                name: 'p',
                attrs: {
                  style: 'text-indent:2em; margin-bottom: 20rpx; font-size: 30rpx; line-height: 1.8; color: #333;',
                },
                children: [{
                  type: 'text',
                  text: p + '；'
                }]
              };
            }
          });
        }
        this.setData({ summaryData: rawData });
  
        // 缓存写入
        const key = `summaryReport_${this.data.userName}`;
        wx.setStorageSync(key, data);
      });
  }
});
