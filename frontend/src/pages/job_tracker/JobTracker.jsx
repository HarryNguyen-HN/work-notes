import { useState, useEffect, useCallback, useRef } from 'react';
import { Space, Table, Button, Modal, Dropdown, Upload, message, DatePicker, Input } from 'antd';
import JobForm from './JobForm';
import { EllipsisOutlined, UploadOutlined, SearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import moment from 'moment';



const JobTracker = () => {
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);

  const [startDate, setStartDate] = useState([]);
  const [endDate, setEndDate] = useState([]);
  const [filteredData, setFilteredData] = useState(data); // State cho dữ liệu hiển thị sau lọc

  // handleSearch start
  // const [searchText, setSearchText] = useState('');
  const searchInput = useRef(null);

  const handleSearch = (selectedKeys, confirm) => {
    confirm();
    // setSearchText(selectedKeys[0]);
  };

  const handleReset = (clearFilters) => {
    clearFilters();
    // setSearchText('');
  };
  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={searchInput}
          placeholder={`Tìm kiếm...`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys, confirm)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Tìm kiếm
          </Button>
          <Button onClick={() => handleReset(clearFilters)} size="small" style={{ width: 90 }}>
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
    onFilter: (value, record) =>
      record[dataIndex]?.toString().toLowerCase().includes(value.toLowerCase()),
    filterDropdownProps: {
      onOpenChange: (visible) => {
        if (visible) {
          setTimeout(() => searchInput.current?.select(), 100);
        }
      },
    },
  });
  // handleSearch 

  // handleFilteredTime
  // Hàm lọc dữ liệu theo phạm vi ngày
  const filterData = useCallback((start, end) => {
    if (!start && !end) {
      setFilteredData(data); // Nếu không chọn ngày nào, trả về toàn bộ dữ liệu
      return;
    }
    const startUnix = start ? start : null;
    const endUnix = end ? end : null;
    const filtered = data.filter((item) => {
      // const itemDate = moment(item.receivedTime, 'YYYY/MM/DD');
      // return itemDate.isBetween(start, end, 'day', '[]');
      const itemDateUnix = moment(item.receivedTime, 'YYYY/MM/DD').valueOf(); // Chuyển đổi ngày của dữ liệu
      if (startUnix && endUnix) {
        return itemDateUnix >= startUnix && itemDateUnix <= endUnix;
      } else if (startUnix) {
        return itemDateUnix >= startUnix;
      } else if (endUnix) {
        return itemDateUnix <= endUnix;
      }
      return true;
    });
    setFilteredData(filtered); // Cập nhật lại dữ liệu đã lọc
  }, [data]);

  const handleStartDateChange = (date) => {
    setStartDate(date); // Cập nhật ngày bắt đầu

    filterData(date, endDate);
  };

  const handleEndDateChange = (date) => {
    setEndDate(date); // Cập nhật ngày kết thúc

    filterData(startDate, date);
  };

  // Hàm chọn phạm vi nhanh
  const handleQuickSelect = useCallback((range) => {
    let startDate, endDate;

    switch (range) {
      case 'today':
        startDate = moment().startOf('day');
        endDate = moment().endOf('day');
        break;
      case 'thisWeek':
        startDate = moment().startOf('week');
        endDate = moment().endOf('week');
        if (endDate.isBefore(moment())) {
          endDate = endDate.endOf('day');
        }
        break;
      case 'thisMonth':
        startDate = moment().startOf('month');
        endDate = moment().endOf('month');
        break;
      case 'thisYear':
        startDate = moment().startOf('year');
        endDate = moment().endOf('year');
        break;
      case 'all': {
        // Tính toán ngày đầu và ngày cuối của dữ liệu
        const allStartDate = moment.min(data.map(item => moment(item.receivedTime, 'YYYY/MM/DD')));
        const allEndDate = moment.max(data.map(item => moment(item.receivedTime, 'YYYY/MM/DD')));

        // Nếu không có dữ liệu, set null
        startDate = allStartDate.isValid() ? allStartDate.startOf('day') : null;
        endDate = allEndDate.isValid() ? allEndDate.endOf('day') : null;
        break;
      }
      default:
        return;
    }

    if (range === 'all') {
      setFilteredData(data); // Nếu chọn "All", reset bảng về toàn bộ dữ liệu
      setStartDate(startDate); // Set ngày bắt đầu
      setEndDate(endDate); // Set ngày kết thúc
    } else {
      setStartDate(startDate);
      setEndDate(endDate);
      filterData(startDate, endDate); // Lọc dữ liệu theo phạm vi đã chọn
    }
  }, [data, filterData]);
  // handleFilteredTime
  useEffect(() => {
    // Gọi handleQuickSelect với 'all' khi trang được load
    if (data.length > 0) {
      handleQuickSelect('all');
    }
  }, [data, handleQuickSelect]);
  // handleFilteredTime end

  // handleChangePageSize start
  const [pageSize, setPageSize] = useState(10);

  // Xử lý khi thay đổi số lượng item trong mỗi trang
  const handlePageSizeChange = (current, newPageSize) => {
    setPageSize(newPageSize);
  };
  // handleChangePageSize end



  // Load dữ liệu từ localStorage khi khởi chạy
  useEffect(() => {
    const storedData = JSON.parse(localStorage.getItem('jobData')) || [];
    setData(storedData);
  }, []);

  // Lưu dữ liệu vào localStorage mỗi khi dữ liệu thay đổi
  useEffect(() => {
    if (data.length > 0) {
      localStorage.setItem('jobData', JSON.stringify(data));
    }
  }, [data]);

  const handleAdd = (values) => {
    const currentTime = moment().format('YYYY/MM/DD');
    const newData = [
      ...data,
      {
        key: String(data.length + 1),
        id: data.length + 1,
        receivedTime: values.receivedTime || currentTime,
        completedTime: values.completedTime || currentTime,
        hoursProcessed: values.hoursProcessed || '-',
        ...values,
      },
    ];
    setData(newData);
    setIsModalOpen(false);
  };

  const handleUpdate = (updatedRecord) => {
    Modal.confirm({
      title: t('modal.saveChanges'),
      onOk: () => {
        const updatedData = data.map((item) =>
          item.id === updatedRecord.id
            ? { ...item, ...updatedRecord } // Chỉ cập nhật item có `key` trùng khớp
            : item // Giữ nguyên các item khác
        );
        setData(updatedData);
        setEditingRecord(null);
      },
    });
  };

  const handleDelete = (key) => {
    Modal.confirm({
      title: t('modal.deleteChanges'),
      onOk: () => {
        const updatedData = data.filter((item) => item.id !== key);
        setData(updatedData);
      },
    });
  };

  const handleViewDetail = (record) => {
    setViewingRecord(record);
  };

  // Chỉnh sửa phần mappedData và updatedData trong handleImportExcel
  const handleImportExcel = (event) => {
    const file = event.target.files[0];
    if (!file) {
      alert('Vui lòng chọn một file Excel.');
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        if (!workbook.SheetNames.includes('Job')) {
          alert('Sheet "Job" không tồn tại trong file Excel.');
          return;
        }

        const worksheet = workbook.Sheets['Job'];
        const importedData = XLSX.utils.sheet_to_json(worksheet);

        if (importedData.length === 0) {
          alert('Sheet "Job" không chứa dữ liệu.');
          return;
        }

        // Lọc dữ liệu: Chỉ giữ các hàng có ít nhất một giá trị hợp lệ trong bất kỳ cột nào
        const filteredData = importedData.filter((row) => {
          return Object.keys(row).some((key) => {
            const value = row[key];
            return value !== null && value !== undefined && value.toString().trim() !== '';
          });
        });

        if (filteredData.length === 0) {
          alert('Tất cả các hàng trong file Excel đều trống.');
          return;
        }

        // Hàm chuyển đổi số seri Excel sang ngày tháng
        const convertExcelDate = (serial) => {
          const excelStartDate = new Date(1899, 11, 30);
          return new Date(excelStartDate.getTime() + serial * 86400000); // 86400000 ms = 1 ngày
        };

        // Ánh xạ các cột trong Excel với các trường trong ứng dụng
        const mappedData = filteredData.map((row, index) => {
          const rawDate = row['Date'];
          const receivedTime =
            typeof rawDate === 'number'
              ? moment(convertExcelDate(rawDate)).format('YYYY/MM/DD')
              : row['Date'] || ''; // Giữ nguyên nếu không phải số seri
          const rawHandler = row['IT 處理人員'] || '';
          const handler = rawHandler.split(',').map((name) => name.trim()); // Tách chuỗi thành mảng và loại bỏ khoảng trắng

          return {
            id: `${index + 1}`,
            receivedTime,
            site: row['Site'] || '',
            level: row['Level'] || '',
            type: row['Type'] || '',
            abnormal: row['Abnormal'] || '',
            job: row['Job'] || '',
            dept_id: row['Dept'] || '',
            // handler: row['IT 處理人員'] || '',
            handler,
            numberOfOccurrences: row['發生次數'] || '',
            processingTime: row['處理時間(min)'] || '',
            content: row['Content'] || '',
          };
        });

        // Kiểm tra trùng lặp trước khi thêm vào dữ liệu hiện có
        const updatedData = [
          ...mappedData.filter(
            (newItem) =>
              !data.some(
                (item) =>
                  item.receivedTime === newItem.receivedTime && item.job === newItem.job
              )
          ),
        ];

        setData(updatedData);
        localStorage.setItem('jobData', JSON.stringify(updatedData)); // Lưu ngay sau khi nhập thành công
        alert('Dữ liệu từ Excel đã được nhập thành công!');
      } catch (error) {
        console.error('Lỗi khi xử lý file Excel:', error);
        alert('Có lỗi xảy ra khi đọc file Excel. Vui lòng kiểm tra lại file.');
      }
    };

    reader.readAsArrayBuffer(file);
    return false;
  };

  // Hàm export dữ liệu ra file Excel

  const handleExportExcel = async () => {
    const exportColumns = [
      { key: "receivedTime", title: "Date" },
      { key: "site", title: "Site" },
      { key: "level", title: "Level" },
      { key: "type", title: "Type" },
      { key: "abnormal", title: "Abnormal" },
      { key: "job", title: "Job" },
      { key: "dept_id", title: "Dept" },
      { key: "handler", title: "IT 處理人員" },
      { key: "numberOfOccurrences", title: "發生次數" },
      { key: "processingTime", title: "處理時間(min)" },
      { key: "content", title: "Content" },
    ];

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Job");

    // **Thêm tiêu đề (Header)**
    const headers = exportColumns.map(col => col.title);
    const keys = exportColumns.map(col => col.key);
    worksheet.addRow(headers);

    // **Định dạng tiêu đề**
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell(cell => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "4F81BD" }, // Xanh đậm
      };
      cell.font = { bold: true, color: { argb: "FFFFFF" }, size: 12 };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    });

    // **Thêm dữ liệu**
    filteredData.forEach((item, rowIndex) => {
      const rowData = keys.map(key =>
        key === "receivedTime" && item[key]
          ? moment(item[key]).format("YYYY/MM/DD")
          : key === "handler" && Array.isArray(item[key])
            ? item[key].join(", ")
            : item[key] || ""
      );

      const row = worksheet.addRow(rowData);

      // **Màu xen kẽ giữa các dòng**
      let rowColor = rowIndex % 2 === 0 ? "F2F2F2" : "FFFFFF"; // Hàng chẵn xám nhạt, hàng lẻ trắng
      row.eachCell((cell, colNumber) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowColor } };
        cell.alignment = { horizontal: keys[colNumber - 1] === "content" ? "left" : "center", vertical: "middle" };
        cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
      });
    });

    // **Thêm bộ lọc dữ liệu**
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: filteredData.length + 1, column: headers.length }
    };

    // **AutoFit cột** (Tính toán độ rộng tối ưu)
    worksheet.columns.forEach((col, i) => {
      let maxLength = headers[i].length; // Độ dài tiêu đề
      filteredData.forEach(row => {
        if (row[keys[i]]) {
          maxLength = Math.max(maxLength, row[keys[i]].toString().length);
        }
      });
      col.width = Math.min(maxLength + 4);
      // col.width = Math.min(maxLength + 4, 50); // AutoFit nhưng không vượt quá 50 ký tự
    });

    // **Tạo file Excel và tải xuống**
    const buffer = await workbook.xlsx.writeBuffer();
    const startTime = moment(startDate).format("YYYY-MM-DD");
    const endTime = moment(endDate).format("YYYY-MM-DD");
    const fileName = `Job_Tracker_Data_${startTime}_${endTime}.xlsx`;

    saveAs(new Blob([buffer], { type: "application/octet-stream" }), fileName);
  };

  const columns = [
    {
      title: t('jobTracker.stt'),
      dataIndex: 'id',
      key: 'id',
      width: 60,
      align: 'center',
      ellipsis: true,
      sorter: (a, b) => a.id - b.id,
      sortDirections: ['descend', 'ascend'],
    },
    {
      title: t('jobTracker.receivedTime'),
      dataIndex: 'receivedTime',
      key: 'receivedTime',
      align: 'center',
      ellipsis: true,
      ...getColumnSearchProps('receivedTime'),
    },
    {
      title: t('jobTracker.job'),
      dataIndex: 'job',
      key: 'job',
      align: 'center',
      ellipsis: true,
      sorter: (a, b) => (a.job || "").localeCompare(b.job || ""),
      sortDirections: ['descend', 'ascend'], // Thêm hướng sắp xếp
      ...getColumnSearchProps('job'),
    },
    {
      title: t('jobTracker.numberOfOccurrences'),
      dataIndex: 'numberOfOccurrences',
      key: 'numberOfOccurrences',
      width: 120,
      align: 'center',
      ellipsis: true,
      sorter: (a, b) => (a.numberOfOccurrences || 0) - (b.numberOfOccurrences || 0),
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: t('jobTracker.processingTime'),
      dataIndex: 'processingTime',
      key: 'processingTime',
      align: 'center',
      render: (text) => text || '-',
      ellipsis: true,
      sorter: (a, b) => (a.processingTime || 0) - (b.processingTime || 0), // Sắp xếp theo thời gian xử lý
      sortDirections: ['descend', 'ascend'],
      width: 100
    },
    {
      title: t('jobTracker.dept'),
      dataIndex: 'dept_id',
      key: 'dept_id',
      width: 120,
      align: 'center',
      ellipsis: true,
      sorter: (a, b) => (a.dept_id || "").localeCompare(b.dept_id || ""),
      sortDirections: ['ascend', 'descend'],
      ...getColumnSearchProps('dept_id'),
    },
    {
      title: t('jobTracker.handler'),
      dataIndex: 'handler',
      key: 'handler',
      align: 'center',
      ellipsis: true,
      render: (handlers) => (handlers && handlers.length > 0 ? handlers.join(', ') : '-'),
      // sorter: (a, b) => a.handler.localeCompare(b.handler), // Sắp xếp theo tên handler
      sorter: (a, b) => {
        const handlerA = (a.handler || []).join(', ').toLowerCase();
        const handlerB = (b.handler || []).join(', ').toLowerCase();
        return handlerA.localeCompare(handlerB);
      },
      sortDirections: ['ascend', 'descend'],
      ...getColumnSearchProps('handler'),
    },
    {
      title: t('menu.actions'),
      key: 'actions',
      ellipsis: true,
      render: (_, record) => (
        <Space>
          <Dropdown
            menu={{
              items: [
                {
                  key: '1',
                  label: t('button.viewDetail'),
                  onClick: () => handleViewDetail(record),
                },
                {
                  key: '2',
                  label: t('button.edit'),
                  onClick: () => setEditingRecord(record),
                },
                {
                  key: '3',
                  label: t('button.delete'),
                  danger: true,
                  onClick: () => handleDelete(record.id),
                },
              ],
            }}
            trigger={['click']}
          >
            <Button shape="circle" icon={<EllipsisOutlined />} />
          </Dropdown>
        </Space>
      ),
      width: 100,
    },
    {
      title: t('jobTracker.type'),
      dataIndex: 'type',
      key: 'type',
      width: 120,
      align: 'center',
      ellipsis: true,
      sorter: (a, b) => (a.type || "").localeCompare(b.type || ""),
      sortDirections: ['ascend', 'descend'],
      ...getColumnSearchProps('type'),
    },
    {
      title: t('jobTracker.abnormal'),
      dataIndex: 'abnormal',
      key: 'abnormal',
      width: 120,
      align: 'center',
      ellipsis: true,
      sorter: (a, b) => (a.abnormal || "").localeCompare(b.abnormal || ""),
      sortDirections: ['ascend', 'descend'],
      ...getColumnSearchProps('abnormal'),
    },
    {
      title: t('jobTracker.content'),
      dataIndex: 'content',
      key: 'content',
      width: 120,
      align: 'left',
      ellipsis: true,
      sorter: (a, b) => (a.content || "").localeCompare(b.content || ""),
      sortDirections: ['ascend', 'descend'],
      ...getColumnSearchProps('content'),
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <Button type="primary" onClick={() => setIsModalOpen(true)}>
          {t('button.add')}
        </Button>
        <Button type="primary" onClick={() => {
          localStorage.removeItem('jobData');
          // setData([])
        }}>
          xoá data
        </Button>
        <Upload
          accept=".xlsx,.xls"
          showUploadList={false}
          beforeUpload={(file) => {
            // Kiểm tra xem file có hợp lệ không
            if (!['.xlsx', '.xls'].includes(file.name.slice(-5))) {
              message.error(t('upload.invalidFileType'));
              return false;
            }
            handleImportExcel({ target: { files: [file] } }); // Gọi hàm xử lý nhập dữ liệu
            return false; // Ngừng tải lên
          }}
        >
          <Button type='primary' icon={<UploadOutlined />}>{t('button.importData')}</Button>
        </Upload>
        {/* Thêm nút Export */}
        <Button type="primary" onClick={handleExportExcel}>
          {t('button.exportData')}
        </Button>
      </div>
      <Space style={{ marginBottom: 16 }}>
        <DatePicker
          value={startDate} // Ngày bắt đầu
          onChange={handleStartDateChange} // Hàm xử lý thay đổi ngày bắt đầu
          style={{ marginRight: 10 }}
          placeholder="Start Date"
          format="YYYY/MM/DD"
        />
        <DatePicker
          value={endDate} // Ngày kết thúc
          onChange={handleEndDateChange} // Hàm xử lý thay đổi ngày kết thúc
          style={{ marginRight: 10 }}
          placeholder="End Date"
          format="YYYY/MM/DD"
        />
        <Button onClick={() => handleQuickSelect('today')}>{t('content.today')}</Button>
        <Button onClick={() => handleQuickSelect('thisWeek')}>{t('content.thisWeek')}</Button>
        <Button onClick={() => handleQuickSelect('thisMonth')}>{t('content.thisMonth')}</Button>
        <Button onClick={() => handleQuickSelect('thisYear')}>{t('content.thisYear')}</Button>
        <Button onClick={() => handleQuickSelect('all')}>{t('content.allTime')}</Button>
      </Space>

      <Table
        rowKey={'id'}
        columns={columns}
        dataSource={filteredData}
        scroll={{ x: 'max-content', y: 300 }}
        style={{ whiteSpace: 'nowrap' }}
        pagination={{
          pageSize, // Sử dụng pageSize từ state
          showSizeChanger: true, // Cho phép người dùng thay đổi pageSize
          pageSizeOptions: [5, 10, 20, 50, filteredData.length],
          onShowSizeChange: handlePageSizeChange,
        }}
      />
      {isModalOpen && (
        <JobForm
          visible={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleAdd}
          modalStyle={{ width: '500px', maxHeight: '80vh' }}
          mode="add"
        />
      )}
      {editingRecord && (
        <JobForm
          visible={!!editingRecord}
          onClose={() => setEditingRecord(null)}
          onSubmit={handleUpdate}
          initialValues={editingRecord}
          modalStyle={{ width: '500px', height: '80vh' }}
          mode="edit"
        />
      )}
      {viewingRecord && (
        <JobForm
          visible={!!viewingRecord}
          onClose={() => setViewingRecord(null)}
          initialValues={viewingRecord}
          modalStyle={{ width: '500px', height: '80vh' }}
          mode="view"
        />
      )}
    </div>
  );
};

export default JobTracker;
