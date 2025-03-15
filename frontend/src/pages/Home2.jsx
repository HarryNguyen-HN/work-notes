import { useState, useEffect, useRef } from 'react';
import { DatePicker, Row, Col, Radio, Button, Typography } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SearchOutlined, CameraOutlined } from '@ant-design/icons';
import moment from 'moment';
import { useTranslation } from 'react-i18next';
import html2canvas from 'html2canvas';

const { Title } = Typography;

const Home2 = () => {
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [startDate, setStartDate] = useState(moment().startOf('month'));
  const [endDate, setEndDate] = useState(moment().endOf('month'));
  const [timeFrame, setTimeFrame] = useState('month');
  const chartRef = useRef(null);

  useEffect(() => {
    const fetchData = () => {
      const storedData = JSON.parse(localStorage.getItem('jobData')) || [];
      const processedData = storedData.map((item) => ({
        ...item,
        processingTime: parseInt(item.processingTime, 10) || 0,
        receivedTime: moment(item.receivedTime, 'YYYY-MM-DD HH:mm').isValid()
          ? moment(item.receivedTime, 'YYYY-MM-DD HH:mm')
          : null,
        completedTime: moment(item.completedTime, 'YYYY-MM-DD HH:mm').isValid()
          ? moment(item.completedTime, 'YYYY-MM-DD HH:mm')
          : null,
      }));
      setData(processedData);
    };

    fetchData();
  }, []);

  useEffect(() => {
    filterData(data, startDate, endDate);
  }, [data, startDate, endDate, timeFrame]);

  const filterData = (dataToFilter, start, end) => {
    const filtered = dataToFilter.filter((item) => {
      return (
        item.receivedTime &&
        item.receivedTime.isValid() &&
        item.receivedTime >= start &&
        item.receivedTime <= end
      );
    });

    setFilteredData(filtered);
  };

  const handleStartDateChange = (value) => {
    setStartDate(value ? value.startOf('day') : null);
  };

  const handleEndDateChange = (value) => {
    setEndDate(value ? value.endOf('day') : null);
  };

  const handleTimeFrameChange = (e) => {
    const value = e.target.value;
    setTimeFrame(value);

    if (value === 'day') {
      setStartDate(moment().startOf('day'));
      setEndDate(moment().endOf('day'));
    } else if (value === 'week') {
      setStartDate(moment().startOf('week'));
      setEndDate(moment().endOf('week'));
    } else if (value === 'month') {
      setStartDate(moment().startOf('month'));
      setEndDate(moment().endOf('month'));
    } else if (value === 'year') {
      setStartDate(moment().startOf('year'));
      setEndDate(moment().endOf('year'));
    } else if (value === 'allTime') {
      if (data.length > 0) {
        const firstDate = data
          .map(item => item.receivedTime)
          .filter(date => date && date.isValid())
          .reduce((min, current) => (current.isBefore(min) ? current : min), moment());

        const lastDate = data
          .map(item => item.receivedTime)
          .filter(date => date && date.isValid())
          .reduce((max, current) => (current.isAfter(max) ? current : max), moment());

        setStartDate(firstDate.startOf('day'));
        setEndDate(lastDate.endOf('day'));
      } else {
        setStartDate(null);
        setEndDate(null);
      }

    } else if (value === 'custom') {
      setStartDate(startDate ? startDate : null);
      setEndDate(endDate ? endDate : null);
    }
  };

  const handleSearch = () => {
    if (startDate && endDate) {
      filterData(data, startDate, endDate);
    }
  };

  const handleCaptureClick = () => {
    if (chartRef.current) {
      html2canvas(chartRef.current).then((canvas) => {
        const dataUrl = canvas.toDataURL();
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = 'chart-screenshot.png';
        link.click();
      });
    }
  };

  const aggregatedData = filteredData.reduce((acc, item) => {
    if (!acc[item.handler]) {
      acc[item.handler] = { request: 0, other: 0, exception: 0 };
    }
    if (item.type === 'Request') {
      acc[item.handler].request += item.processingTime;
    } else if (item.type === 'Other') {
      acc[item.handler].other += item.processingTime;
    } else if (item.type === 'Exception') {
      acc[item.handler].exception += item.processingTime;
    }
    return acc;
  }, {});

  const chartData = Object.keys(aggregatedData).map((handler) => ({
    handler,
    ...aggregatedData[handler],
  }));

  const barSize = chartData.length === 1 ? 80 : 100;

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
        <Col>
          <DatePicker
            value={startDate}
            onChange={handleStartDateChange}
            format="YYYY-MM-DD"
            placeholder={t('content.startDate')}
            disabled={timeFrame !== 'custom'}
          />
        </Col>
        <Col>
          <DatePicker
            value={endDate}
            onChange={handleEndDateChange}
            format="YYYY-MM-DD"
            placeholder={t('content.endDate')}
            disabled={timeFrame !== 'custom'}
          />
        </Col>
        <Col>
          <Radio.Group onChange={handleTimeFrameChange} value={timeFrame}>
            <Radio.Button value="day">{t('content.today')}</Radio.Button>
            <Radio.Button value="week">{t('content.thisWeek')}</Radio.Button>
            <Radio.Button value="month">{t('content.thisMonth')}</Radio.Button>
            <Radio.Button value="year">{t('content.thisYear')}</Radio.Button>
            <Radio.Button value="allTime">{t('content.allTime')}</Radio.Button>
            <Radio.Button value="custom">{t('content.custom')}</Radio.Button>
          </Radio.Group>
        </Col>
        {timeFrame === 'custom' && (
          <Col>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearch}
              disabled={!startDate || !endDate}
            >
              {t('button.search')}
            </Button>
          </Col>
        )}
      </Row>

      <Title level={4}>{t('content.workCompletionChart')}</Title>
      <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
        <Col>
          <Button
            type="default"
            icon={<CameraOutlined />}
            onClick={handleCaptureClick}
          >
            {t('button.captureChart')}
          </Button>
        </Col>
      </Row>
      <div ref={chartRef}>
        <Title level={2}>Working hours of individuals by task type (minutes)</Title>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="handler" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="request" stackId="a" fill="#82ca9d" name="Request" barSize={barSize} />
            <Bar dataKey="other" stackId="a" fill="#8884d8" name="Other" barSize={barSize} />
            <Bar dataKey="exception" stackId="a" fill="#ff6666" name="Exception" barSize={barSize} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Home2;