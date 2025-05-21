const { PHQ9_QUESTIONS, GAD7_QUESTIONS } = require('../../utils/constants.js');
const api = require('../../api/api');
const request = require('../../utils/request');
var chatapp = getApp();

function formatDateTime(dateStr) {
  const date = new Date(dateStr);
  const pad = n => (n < 10 ? '0' + n : n);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
         `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

Page({
  data: {
    userName: chatapp.globalData.id,
    phq9Score: 0,
    gad7Score: 0,
    evaluation: '',
    phq9Details: [],
    gad7Details: [],
    last_modified: '',
    phq9_level: '',
    gad7_level: '',
    showRedDot: false,         // 红点提示状态
    firstUpdateDone: false     // 是否完成首次更新
  },

  onLoad() {
    this.loadDataFromCacheOrDefault();
    this.fetchAssessmentData();  // 页面加载时调用
  },
  onShow() {
  },
  
  // 请求后端接口，获取评估数据
  fetchAssessmentData() {
    const user_name = this.data.userName;
    if (!user_name) {
      console.warn("没有有效的 userName，无法获取评估数据");
      return;
    }
    api.getAssessmentData(user_name).then(res => {
      if (res.status === 200 && res.data) {
        const data = res.data;
        // data里面字段结构跟后端返回的data对象保持一致
        // 把细节处理成前端需要的格式，包括问题和得分等
        const phq9Details = data.phq9_detail.map((item, idx) => ({
          question: PHQ9_QUESTIONS[idx],
          score: item.score || 0,
          symptom: item.symptom || '-暂无数据-'
        }));
        const gad7Details = data.gad7_detail.map((item, idx) => ({
          question: GAD7_QUESTIONS[idx],
          score: item.score || 0,
          symptom: item.symptom || '-暂无数据-'
        }));
        // 时间格式化处理
        const last_modified = formatDateTime(data.last_modified);

        this.setData({
          phq9Score: data.phq9_score || 0,
          gad7Score: data.gad7_score || 0,
          phq9_level: data.phq9_level || '',
          gad7_level: data.gad7_level || '',
          phq9Details,
          gad7Details,
          last_modified,
          // evaluation: data.evaluation || '',
          firstUpdateDone: true
        });

        // 把最新数据缓存起来
        wx.setStorageSync('evalOverview', {
          phq9_score: data.phq9_score,
          gad7_score: data.gad7_score,
          phq9_level: data.phq9_level,
          gad7_level: data.gad7_level,
          last_modified: last_modified,
          phq9_detail: phq9Details,
          gad7_detail: gad7Details
        });
      } else {
        console.error("接口返回错误:", res);
      }
    }).catch(err => {
      console.error("获取评估数据失败:", err);
    });
  },
  
  loadDataFromCacheOrDefault() {
    const data = wx.getStorageSync('evalOverview');
    let phq9Details = PHQ9_QUESTIONS.map((q, i) => ({
      question: q,
      score: 0,
      symptom: '-暂无数据-'
    }));
    let gad7Details = GAD7_QUESTIONS.map((q, i) => ({
      question: q,
      score: 0,
      symptom: '-暂无数据-'
    }));

    if (data) {
      phq9Details = phq9Details.map((item, index) => ({
        ...item,
        score: data.phq9_scores ? data.phq9_scores[index] || 0 : 0,
        symptom: data.phq9_symptoms ? data.phq9_symptoms[index] || '-暂无数据-' : '-暂无数据-'
      }));
      gad7Details = gad7Details.map((item, index) => ({
        ...item,
        score: data.gad7_scores ? data.gad7_scores[index] || 0 : 0,
        symptom: data.gad7_symptoms ? data.gad7_symptoms[index] || '-暂无数据-' : '-暂无数据-'
      }));
       // 时间格式化处理
      if (data.last_modified) {
        data.last_modified = formatDateTime(data.last_modified);
      }

      this.setData({
        phq9Score: data.phq9_score,
        gad7Score: data.gad7_score,
        // evaluation: data.evaluation,
        last_modified: data.last_modified || '',
        phq9_level: data.phq9_level || '',
        gad7_level: data.gad7_level || '',
        phq9Details,
        gad7Details
      });
    } else {
      this.setData({
        phq9Details,
        gad7Details
      });
    }
  }
});
