import { useState, useEffect, useCallback, useRef } from 'react';
import { Space, Table, Button, Modal, Dropdown, Upload, message, DatePicker, Tag, Input } from 'antd';
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { EllipsisOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';
import moment from 'moment';
import MISArchiveForm from './MISArchiveForm';



const MISArchive = () => {
    const { t } = useTranslation();
    const [data, setData] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewingRecord, setViewingRecord] = useState(null);
    const [editingRecord, setEditingRecord] = useState(null);
    const [device, setDevice] = useState([]);


    const [startDate, setStartDate] = useState([]);
    const [endDate, setEndDate] = useState([]);
    const [filteredData, setFilteredData] = useState(data); // State cho dữ liệu hiển thị sau lọc

    // Hàm lọc dữ liệu theo phạm vi ngày
    const filterData = useCallback((start, end) => {
        if (!start && !end) {
            setFilteredData(data); // Nếu không chọn ngày nào, trả về toàn bộ dữ liệu
            return;
        }
        const startUnix = start ? start : null;
        const endUnix = end ? end : null;
        const filtered = data.filter((item) => {
            // const itemDate = moment(item.date, 'YYYY/MM/DD');
            // return itemDate.isBetween(start, end, 'day', '[]');
            const itemDateUnix = moment(item.date, 'YYYY/MM/DD').valueOf(); // Chuyển đổi ngày của dữ liệu
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
                const allStartDate = moment.min(data.map(item => moment(item.date, 'YYYY/MM/DD')));
                const allEndDate = moment.max(data.map(item => moment(item.date, 'YYYY/MM/DD')));

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
    const loadDevice = useCallback(() => {
        const saveDevice = JSON.parse(localStorage.getItem('device')) || [];
        setDevice(saveDevice);
    }, []);
    useEffect(() => {
        // Gọi handleQuickSelect với 'all' khi trang được load
        if (data.length > 0) {
            handleQuickSelect('all');
        }
        loadDevice();
    }, [data, handleQuickSelect, loadDevice]);
    // State để lưu số lượng items trên mỗi trang
    const [pageSize, setPageSize] = useState(10);

    // Xử lý khi thay đổi số lượng item trong mỗi trang
    const handlePageSizeChange = (current, newPageSize) => {
        setPageSize(newPageSize);
    };

    // Load dữ liệu từ localStorage khi khởi chạy
    useEffect(() => {
        const storedData = JSON.parse(localStorage.getItem('misArchive')) || [];
        setData(storedData);
    }, []);

    // Lưu dữ liệu vào localStorage mỗi khi dữ liệu thay đổi
    useEffect(() => {
        if (data.length > 0) {
            localStorage.setItem('misArchive', JSON.stringify(data));
        }
    }, [data]);

    const handleAdd = (values) => {
        const currentTime = moment().format('YYYY/MM/DD');
        const newItem = {
            warehouse_id: data.length + 1,
            date: values.date || currentTime,
            ...values,
        };
        const newData = [...data, newItem];
        //fgColor: { argb: item.act === "give" ? "ADD8E6" : item.act === "receive" ? 
        const updatedDevice = device.map((item) => {
            if (newItem.device_id === item.device_id) {
                return {
                    ...item,
                    quantity: newItem.act === 'give'
                        ? parseInt(item.quantity) - parseInt(newItem.quantity)
                        : parseInt(item.quantity) + parseInt(newItem.quantity)
                };

            }

            return item;
        });
        // Lưu vào localStorage
        localStorage.setItem('device', JSON.stringify(updatedDevice));
        setDevice(updatedDevice);
        setData(newData);
        setIsModalOpen(false);
    };

    const handleUpdate = (updatedRecord) => {
        Modal.confirm({
            title: t('modal.saveChanges'),
            onOk: () => {
                const oldRecord = data.find(item => item.warehouse_id === updatedRecord.warehouse_id); // Lấy dữ liệu cũ trước khi cập nhật
                
                const updatedData = data.map((item) =>
                    item.warehouse_id === updatedRecord.warehouse_id
                        ? { ...item, ...updatedRecord } // Cập nhật dữ liệu mới
                        : item
                );
    
                // Cập nhật số lượng trong device
                const updatedDevice = device.map((item) => {
                    if (updatedRecord.device_id === item.device_id) {
                        // Lấy số lượng cũ và số lượng mới
                        const oldQuantity = parseInt(oldRecord.quantity, 10);
                        const newQuantity = parseInt(updatedRecord.quantity, 10);
    
                        // Điều chỉnh số lượng dựa trên thay đổi
                        let updatedQuantity = parseInt(item.quantity, 10);
    
                        if (oldRecord.act === 'give') {
                            updatedQuantity += oldQuantity; // Hoàn lại số lượng cũ
                        } else if (oldRecord.act === 'receive') {
                            updatedQuantity -= oldQuantity;
                        }
    
                        if (updatedRecord.act === 'give') {
                            updatedQuantity -= newQuantity; // Trừ đi số lượng mới
                        } else if (updatedRecord.act === 'receive') {
                            updatedQuantity += newQuantity;
                        }
    
                        return {
                            ...item,
                            quantity: updatedQuantity
                        };
                    }
                    return item;
                });
    
                // Lưu vào localStorage
                localStorage.setItem('device', JSON.stringify(updatedDevice));
    
                // Cập nhật state
                setDevice(updatedDevice);
                setData(updatedData);
                setEditingRecord(null);
            },
        });
    };

    const handleDelete = (key) => {
        Modal.confirm({
            title: t('modal.deleteChanges'),
            onOk: () => {
                // Lấy bản ghi cần xóa
                const deletedRecord = data.find((item) => item.warehouse_id === key);
    
                // Xóa bản ghi khỏi data
                const updatedData = data.filter((item) => item.warehouse_id !== key);
    
                // Cập nhật số lượng thiết bị
                const updatedDevice = device.map((item) => {
                    if (deletedRecord.device_id === item.device_id) {
                        let updatedQuantity = parseInt(item.quantity, 10);
    
                        if (deletedRecord.act === 'give') {
                            updatedQuantity += parseInt(deletedRecord.quantity, 10); // Hoàn lại số lượng khi xóa
                        } else if (deletedRecord.act === 'receive') {
                            updatedQuantity -= parseInt(deletedRecord.quantity, 10);
                        }
    
                        return {
                            ...item,
                            quantity: updatedQuantity
                        };
                    }
                    return item;
                });
    
                // Lưu vào localStorage
                localStorage.setItem('device', JSON.stringify(updatedDevice));
    
                // Cập nhật state
                setDevice(updatedDevice);
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

                if (!workbook.SheetNames.includes('MisArchive')) {
                    alert('Sheet "MisArchive" không tồn tại trong file Excel.');
                    return;
                }

                const worksheet = workbook.Sheets['MisArchive'];
                const importedData = XLSX.utils.sheet_to_json(worksheet);

                if (importedData.length === 0) {
                    alert('Sheet "MisArchive" không chứa dữ liệu.');
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
                    const date =
                        typeof rawDate === 'number'
                            ? moment(convertExcelDate(rawDate)).format('YYYY/MM/DD')
                            : row['Date'] || ''; // Giữ nguyên nếu không phải số seri


                    return {
                        warehouse_id: `${index + 1}`,
                        date,
                        act: row['Act'] || '',
                        device_id: row['Device'] || '',
                        quantity: row['Quantity'] || '',
                        dept: row['Dept-Received'] || '',
                        receiver: row['Receiver'] || '',
                        content: row['Content'] || '',
                    };
                });

                // Kiểm tra trùng lặp trước khi thêm vào dữ liệu hiện có
                const updatedData = [
                    ...mappedData.filter(
                        (newItem) =>
                            !data.some(
                                (item) =>
                                    item.date === newItem.date && item.act === newItem.act && item.device_id === newItem.device_id && item.receiver === newItem.receiver
                            )
                    ),
                ];

                setData(updatedData);
                localStorage.setItem('misArchive', JSON.stringify(updatedData)); // Lưu ngay sau khi nhập thành công
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
            { key: "warehouse_id", title: "Stt" },
            { key: "date", title: "Date" },
            { key: "act", title: "Act" },
            { key: "device_id", title: "Device" },
            { key: "quantity", title: "Quantity" },
            { key: "dept", title: "Dept-Received" },
            { key: "receiver", title: "Receiver" },
            { key: "content", title: "Content" },
        ];

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("MisArchive");

        // **Thêm tiêu đề (Header)**
        const headers = exportColumns.map(col => col.title);
        const keys = exportColumns.map(col => col.key);

        worksheet.addRow(headers);

        // **Áp dụng định dạng tiêu đề**
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell(cell => {
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "4F81BD" }, // Xanh đậm
            };
            cell.font = {
                bold: true,
                color: { argb: "FFFFFF" }, // Chữ trắng
                size: 12,
            };
            cell.alignment = { horizontal: "center", vertical: "middle" };
            cell.border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };
        });

        // **Thêm dữ liệu vào bảng**
        filteredData.forEach((item, rowIndex) => {
            const rowData = keys.map(key =>
                key === "warehouse_id"
                    ? `${item.warehouse_id}`
                    : key === "receiver" && Array.isArray(item[key])
                        ? item[key].join(", ")
                        : item[key]
            );

            const row = worksheet.addRow(rowData);

            // **Xác định màu xen kẽ giữa các dòng**
            let rowColor = rowIndex % 2 === 0 ? "F2F2F2" : "E0E0E0"; // Hàng chẵn sáng hơn, hàng lẻ tối hơn

            row.eachCell((cell, colNumber) => {
                // **Tô màu cột "Act" riêng biệt**
                if (keys[colNumber - 1] === "act") {
                    cell.fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: item.act === "give" ? "ADD8E6" : item.act === "receive" ? "90EE90" : "FFFFFF" },
                    };
                } else {
                    // **Tô màu các cột còn lại theo hàng chẵn/lẻ**
                    cell.fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: rowColor },
                    };
                }

                // **Căn giữa tất cả các cột trừ "Content"**
                cell.alignment = {
                    horizontal: keys[colNumber - 1] === "content" ? "left" : "center",
                    vertical: "middle",
                };

                // **Thêm viền cho từng ô**
                cell.border = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" },
                };
            });
        });

        // **Tự động điều chỉnh độ rộng cột**
        worksheet.columns.forEach((col, i) => {
            let maxLength = headers[i].length;
            filteredData.forEach(row => {
                if (row[keys[i]]) {
                    maxLength = Math.max(maxLength, row[keys[i]].toString().length);
                }
            });
            col.width = maxLength + 2;
        });

        // **Tạo file Excel và tải xuống**
        const buffer = await workbook.xlsx.writeBuffer();
        const startTime = moment(startDate).format("YYYY-MM-DD");
        const endTime = moment(endDate).format("YYYY-MM-DD");
        const fileName = `MisArchive_Data_${startTime}_${endTime}.xlsx`;

        saveAs(new Blob([buffer], { type: "application/octet-stream" }), fileName);
    };

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
    // handleSearch end

    const columns = [
        {
            title: t('jobTracker.stt'),
            dataIndex: 'warehouse_id',
            key: 'warehouse_id',
            width: 100,
            align: 'center',
            sorter: (a, b) => a.warehouse_id - b.warehouse_id,
            sortDirections: ['descend', 'ascend'],
            ...getColumnSearchProps('warehouse_id'),
        },
        {
            title: t('jobTracker.date'),
            dataIndex: 'date',
            key: 'date',
            align: 'center',
            ellipsis: true,
            // ...getColumnSearchProps('date'),
        },
        {
            title: t('jobTracker.act'),
            dataIndex: 'act',
            key: 'act',
            render: (act) => {
                const statusColors = {
                    receive: 'green',
                    give: 'blue',
                    other: 'red',
                };
                return <Tag color={statusColors[act]}>{act || 'N/A'}</Tag>;
            },
            align: 'center',
            ellipsis: true,
            sorter: (a, b) => a.act.localeCompare(b.act),
            sortDirections: ['descend', 'ascend'],
            ...getColumnSearchProps('act'),
        },
        {
            title: t('jobTracker.device'),
            dataIndex: 'device_id',
            key: 'device_id',
            align: 'center',
            ellipsis: true,
            render: (device_id) => {
                const devices = device.find((item) => item.device_id === device_id);
                return devices ? devices.device_name : 'N/A'; // Nếu không tìm thấy, hiển thị "N/A"
            },
            sorter: (a, b) => {
                const deviceA = device.find((item) => item.device_id === a.device_id);
                const deviceB = device.find((item) => item.device_id === b.device_id);
                return (deviceA?.device_name || '').localeCompare(deviceB?.device_name || '');
            },
            sortDirections: ['descend', 'ascend'],
            ...getColumnSearchProps('device_id'),
            ...getColumnSearchProps('device_id'),
        },
        {
            title: t('jobTracker.quantity'),
            dataIndex: 'quantity',
            key: 'quantity',
            align: 'center',
            render: (text) => text || '-',
            ellipsis: true,
            sorter: (a, b) => (a.quantity || 0) - (b.quantity || 0),
            sortDirections: ['descend', 'ascend'],
            width: 100,
            ...getColumnSearchProps('quantity'),
        },
        {
            title: t('jobTracker.dept_receiver'),
            dataIndex: 'dept',
            key: 'dept',
            width: 120,
            align: 'center',
            ellipsis: true,
            sorter: (a, b) => a.dept.localeCompare(b.dept), // Sắp xếp theo tên department
            sortDirections: ['ascend', 'descend'],
            ...getColumnSearchProps('dept'),
        },
        {
            title: t('jobTracker.receiver'),
            dataIndex: 'receiver',
            key: 'receiver',
            align: 'center',
            ellipsis: true,
            sorter: (a, b) => a.receiver.localeCompare(b.receiver),
            sortDirections: ['ascend', 'descend'],
            ...getColumnSearchProps('receiver'),
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
                                    onClick: () => handleDelete(record.warehouse_id),
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
    ];

    return (
        <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <Button type="primary" onClick={() => setIsModalOpen(true)}>
                    {t('button.add')}
                </Button>
                <Button type="primary" onClick={() => {
                    localStorage.removeItem('misArchive');
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
            <h2>Bảng lĩnh nhận - cấp tài sản MIS</h2>
            <Table
                rowKey={'warehouse_id'}
                columns={columns}
                dataSource={filteredData}
                scroll={{ x: 'max-content', y: 300 }}
                style={{ whiteSpace: 'normal' }}
                pagination={{
                    pageSize, // Sử dụng pageSize từ state
                    showSizeChanger: true, // Cho phép người dùng thay đổi pageSize
                    pageSizeOptions: [5, 10, 20, 50, filteredData.length],
                    onShowSizeChange: handlePageSizeChange,
                }}
                tableLayout="fixed"
            />
            {isModalOpen && (
                <MISArchiveForm
                    visible={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleAdd}
                    modalStyle={{ width: '500px', maxHeight: '80vh' }}
                    mode="add"
                />
            )}
            {editingRecord && (
                <MISArchiveForm
                    visible={!!editingRecord}
                    onClose={() => setEditingRecord(null)}
                    onSubmit={handleUpdate}
                    initialValues={editingRecord}
                    modalStyle={{ width: '500px', height: '80vh' }}
                    mode="edit"
                />
            )}
            {viewingRecord && (
                <MISArchiveForm
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

export default MISArchive;
