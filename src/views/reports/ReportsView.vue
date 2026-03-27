<template>
  <section class="page-wrap">
    <article class="panel">
      <h2>Hisobotlar API</h2>
      <p>daily / weekly / monthly / computers / top-users / revenue chart.</p>

      <div class="actions">
        <button type="button" class="btn" @click="runDaily">Daily</button>
        <button type="button" class="btn" @click="runWeekly">Weekly</button>
        <button type="button" class="btn" @click="runMonthly">Monthly</button>
        <button type="button" class="btn" @click="runComputers">Computers stats</button>
        <button type="button" class="btn" @click="runTopUsers">Top users</button>
        <button type="button" class="btn" @click="runRevenue">Revenue chart</button>
      </div>
    </article>

    <article class="panel">
      <h3>Natija</h3>
      <pre class="json-box">{{ pretty(lastResponse) }}</pre>
    </article>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import reportsApi from '@/api/reports'

const lastResponse = ref(null)

const pretty = (value) => {
  if (value === null || value === undefined) return 'No data'
  return JSON.stringify(value, null, 2)
}

const runRequest = async (request, successMessage) => {
  try {
    const data = await request()           // reports.js allaqachon .data ni qaytaradi
    lastResponse.value = data
    ElMessage.success(successMessage)
  } catch (error) {
    console.error(error)
    ElMessage.error(
      error?.response?.data?.message ||
      error?.message ||
      'Hisobotni olib bo‘lmadi'
    )
  }
}

const runDaily     = () => runRequest(() => reportsApi.getDailyReport(),     'Daily report olindi')
const runWeekly    = () => runRequest(() => reportsApi.getWeeklyReport(),    'Weekly report olindi')
const runMonthly   = () => runRequest(() => reportsApi.getMonthlyReport(),   'Monthly report olindi')
const runComputers = () => runRequest(() => reportsApi.getComputersStats(),  'Computers stats olindi')
const runTopUsers  = () => runRequest(() => reportsApi.getTopUsers(),        'Top users olindi')
const runRevenue   = () => runRequest(() => reportsApi.getRevenueChart(),    'Revenue chart olindi')
</script>

<style scoped>
.page-wrap {
  display: grid;
  gap: 14px;
  padding: 20px;
}

.panel {
  border-radius: 18px;
  border: 1px solid rgba(125, 190, 255, 0.28);
  background: linear-gradient(145deg, rgba(8, 20, 44, 0.9), rgba(10, 27, 59, 0.7));
  padding: 18px;
}

h2, h3 {
  margin: 0;
  color: #f4f9ff;
}

p {
  margin: 8px 0 0;
  color: #a8bfdc;
}

.actions {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.btn {
  border-radius: 10px;
  padding: 9px 12px;
  border: 1px solid rgba(131, 191, 255, 0.45);
  background: rgba(20, 50, 99, 0.54);
  color: #e4f1ff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:hover {
  background: rgba(30, 70, 130, 0.8);
  transform: translateY(-1px);
}

.json-box {
  margin: 12px 0 0;
  border-radius: 12px;
  border: 1px solid rgba(133, 191, 255, 0.28);
  background: rgba(7, 20, 42, 0.74);
  padding: 12px;
  font-size: 12px;
  line-height: 1.4;
  color: #c7dcf7;
  max-height: 420px;
  overflow: auto;
  white-space: pre;
}
</style>