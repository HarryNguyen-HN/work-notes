import React from 'react';
import { Bar } from '@ant-design/charts';

const About = () => {

  // Dữ liệu
  const data = [
    { handler: 'Người xử lý 1', task: 'Công việc C1', time: 15, frequency: 4 },
    { handler: 'Người xử lý 1', task: 'Công việc C2', time: 30, frequency: 3 },
    { handler: 'Người xử lý 2', task: 'Công việc C1', time: 5, frequency: 1 },
    { handler: 'Người xử lý 2', task: 'Công việc C2', time: 10, frequency: 2 },
    { handler: 'Người xử lý 2', task: 'Công việc C3', time: 50, frequency: 6 },
  ];

  const config = {
    data,
    xField: 'handler',   // Trục X hiển thị người xử lý
    yField: 'time',      // Trục Y hiển thị thời gian xử lý
    seriesField: 'task', // Phân biệt các loại công việc
    colorField: 'task',  // Dựa trên 'task' để phân loại màu sắc
    legend: { position: 'top-left' }, // Vị trí của legend
    label: {
      position: 'middle', // Vị trí nhãn
      style: { fill: '#fff', opacity: 0.6 },
      
    },
    
  };

  return <Bar {...config} />;
};

export default About;
