import { useState, useEffect, useRef } from 'react';
import { DatePicker, Row, Col, Radio, Button, Typography, message } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { SearchOutlined, CameraOutlined } from '@ant-design/icons';
import moment from 'moment';
import { useTranslation } from 'react-i18next';
import html2canvas from 'html2canvas';

const { Title } = Typography;
const barColor = '#42a5f5';

const Home = () => {
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
        receivedTime: moment(item.receivedTime, 'YYYY/MM/DD') || null,
      }));
      setData(processedData);
    };
    fetchData();

  }, []);
  useEffect(() => {
    // notification.open({
    //   type: 'info',
    //   message: 'Welcome to Note work',
    //   description:
    //     'This is the content of the notification.',

    //   onClick: () => {
    //     console.log('Notification Clicked!');
    //   },
    // });
    message.info("Welcome to note work")
  }, [])

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
          .map((item) => item.receivedTime)
          .filter((date) => date && date.isValid())
          .reduce((min, current) => (current.isBefore(min) ? current : min), moment());

        const lastDate = data
          .map((item) => item.receivedTime)
          .filter((date) => date && date.isValid())
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

  const chartData = filteredData.map((item) => ({
    // handler: item.handler || 'null',
    handler: Array.isArray(item.handler) ? item.handler.join(', ') : 'null',
    processingTime: item.processingTime || 'null',
    job: item.job || 'null',
    dept: item.dept || 'null',
    receivedTime: item.receivedTime ? item.receivedTime.format('YYYY/MM/DD') : 'N/A',
  }));

  // Đối tượng để lưu màu sắc cho mỗi tên
  const handlerColorMap = {};

  // Hàm để lấy màu sắc cho mỗi handler
  const getBarColor = (handler) => {
    if (!handlerColorMap[handler]) {
      const hashCode = handler.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const hue = hashCode % 360;
      handlerColorMap[handler] = `hsl(${hue}, 70%, 50%)`;
    }
    return handlerColorMap[handler];
  };

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
        <Col>
          <DatePicker
            value={startDate}
            onChange={handleStartDateChange}
            format="YYYY/MM/DD"
            placeholder={t('content.startDate')}
            disabled={timeFrame !== 'custom'}
          />
        </Col>
        <Col>
          <DatePicker
            value={endDate}
            onChange={handleEndDateChange}
            format="YYYY/MM/DD"
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
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="handler" />
            <YAxis />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length > 0) {
                  const item = payload[0].payload;

                  // Kiểm tra và xử lý handler
                  // const handlers = Array.isArray(item.handler)
                  //   ? item.handler.map((h, i) => <ul key={i}>{h}</ul>) // Nếu là mảng, tạo danh sách
                  //   : item.handler
                  //     ? [<ul key="0">{item.handler}</ul>] // Nếu là chuỗi, thêm vào danh sách
                  //     : [<ul key="0">N/A</ul>]; // Nếu không tồn tại, hiển thị 'N/A'

                  return (
                    <div
                      style={{
                        padding: '10px',
                        justifyItems: 'left',
                        backgroundColor: '#fff',
                        borderRadius: '5px',
                        border: '1px solid #ddd',
                      }}
                    >
                      <p>
                        <strong>{t('jobTracker.handler')}:</strong>[ {item.handler || 'N/A'} ]
                      </p>
                      {/* <ul>{handlers}</ul> */}
                      <p>
                        <strong>{t('jobTracker.job')}:</strong> {item.job || 'N/A'}
                      </p>
                      <p>
                        <strong>{t('jobTracker.dept')}:</strong> {item.dept || 'N/A'}
                      </p>
                      <p>
                        <strong>{t('jobTracker.receivedTime')}:</strong> {item.receivedTime || 'N/A'}
                      </p>
                      <p>
                        <strong>{t('jobTracker.processingTime')}:</strong> {item.processingTime || 'N/A'} phút
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* <Legend /> */}
            <Bar
              dataKey="processingTime"
              name={t('jobTracker.processingTime')}
              barSize={50}
              maxBarSize={70}
              fill={barColor}
              isAnimationActive={true}
              onClick={(data) => console.log('Bar clicked:', data)}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.handler)} />
              ))}
            </Bar>
          </BarChart>

        </ResponsiveContainer>
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '10px' }}>
          {Object.keys(handlerColorMap).map((handler, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: handlerColorMap[handler],
                  marginRight: '10px',
                }}
              />
              <span>[ {handler} ]</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
