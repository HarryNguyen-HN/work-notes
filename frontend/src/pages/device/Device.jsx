import { useState, useEffect, useCallback, useRef } from 'react';
import { Space, Table, Button, Modal, Dropdown, Upload, message, DatePicker, Input } from 'antd';
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { EllipsisOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';
import moment from 'moment';
import DeviceForm from './DeviceForm';

const Device = () => {
    const { t } = useTranslation();
    const [data, setData] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewingRecord, setViewingRecord] = useState(null);
    const [editingRecord, setEditingRecord] = useState(null);

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
    useEffect(() => {
        // Gọi handleQuickSelect với 'all' khi trang được load
        if (data.length > 0) {
            handleQuickSelect('all');
        }
    }, [data, handleQuickSelect]);
    // State để lưu số lượng items trên mỗi trang
    const [pageSize, setPageSize] = useState(10);

    // Xử lý khi thay đổi số lượng item trong mỗi trang
    const handlePageSizeChange = (current, newPageSize) => {
        setPageSize(newPageSize);
    };

    // Load dữ liệu từ localStorage khi khởi chạy
    useEffect(() => {
        const storedData = JSON.parse(localStorage.getItem('device')) || [];
        setData(storedData);
    }, []);

    // Lưu dữ liệu vào localStorage mỗi khi dữ liệu thay đổi
    useEffect(() => {
        if (data.length > 0) {
            localStorage.setItem('device', JSON.stringify(data));
        }
    }, [data]);

    const handleAdd = (values) => {
        const purchaseDate = moment().format('YYYY/MM/DD') || null;
        const warrantyExpiry = moment().format('YYYY/MM/DD') || null;
        const newData = [
            ...data,
            {
                device_id: (() => {
                    let newId = data.length + 1;
                    let existingData = new Set(data.map(item => item.device_id));
                    if (existingData.has(newId)) {
                        newId++;
                    }
                    return newId;
                })()
                ,
                purchase_date: purchaseDate,
                warranty_expiry: warrantyExpiry,
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
                    item.device_id === updatedRecord.device_id
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
                const updatedData = data.filter((item) => item.device_id !== key);
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

                if (!workbook.SheetNames.includes('Device')) {
                    alert('Sheet "Device" không tồn tại trong file Excel.');
                    return;
                }

                const worksheet = workbook.Sheets['Device'];
                const importedData = XLSX.utils.sheet_to_json(worksheet);

                if (importedData.length === 0) {
                    alert('Sheet "Device" không chứa dữ liệu.');
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
                const mappedData = filteredData.map((row) => {
                    const rawPurchaseDate = row['purchase_date'];
                    const rawWarrantyDate = row['warranty_expiry'];
                    const purchase_date =
                        typeof rawDate === 'number'
                            ? moment(convertExcelDate(rawPurchaseDate)).format('YYYY/MM/DD')
                            : row['purchase_date'] || ''; // Giữ nguyên nếu không phải số seri
                    const warranty_expiry =
                        typeof rawWarrantyDate === 'number'
                            ? moment(convertExcelDate(rawWarrantyDate)).format('YYYY/MM/DD')
                            : row['warranty_expiry'] || '';


                    return {
                        device_id: row['device_id'] || '',
                        device_name: row['device_name'] || '',
                        category: row['category'] || '',
                        status: row['status'] || '',
                        location: row['location'] || '',
                        purchase_date,
                        warranty_expiry,
                        quantity: row['quantity'] || '',
                        dept_id: row['dept_id'] || '',
                        content: row['content'] || '',
                    };
                });

                // Kiểm tra trùng lặp trước khi thêm vào dữ liệu hiện có
                const updatedData = [
                    ...mappedData.filter(
                        (newItem) =>
                            !data.some(
                                (item) =>
                                    item.device_id === newItem.device_id
                            )
                    ),
                ];

                setData(updatedData);
                localStorage.setItem('device', JSON.stringify(updatedData)); // Lưu ngay sau khi nhập thành công
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
            { key: "device_id", title: "device_id" },
            { key: "device_name", title: "device_name" },
            { key: "category", title: "category" },
            { key: "status", title: "status" },
            { key: "location", title: "location" },
            { key: "purchase_date", title: "purchase_date" },
            { key: "warranty_expiry", title: "warranty_expiry" },
            { key: "quantity", title: "quantity" },
            { key: "dept_id", title: "dept_id" },
            { key: "content", title: "Content" },
        ];

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Device");

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
            // const rowData = keys.map(key =>
            //     key === "device_id"
            //         ? `${item.device_id}`
            //         : key === "receiver" && Array.isArray(item[key])
            //             ? item[key].join(", ")
            //             : item[key]
            // );
            const rowData = keys.map(key => item[key] || "");

            const row = worksheet.addRow(rowData);

            // **Xác định màu xen kẽ giữa các dòng**
            let rowColor = rowIndex % 2 === 0 ? "F2F2F2" : "E0E0E0"; // Hàng chẵn sáng hơn, hàng lẻ tối hơn

            row.eachCell((cell, colNumber) => {
                // **Tô màu cột "Act" riêng biệt**
                if (keys[colNumber - 1] === "status") {
                    cell.fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: item.status === "give" ? "ADD8E6" : item.status === "receive" ? "90EE90" : "FFFFFF" },
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
        const fileName = `Device${startTime}_${endTime}.xlsx`;

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
            title: 'Device ID',
            dataIndex: 'device_id',
            key: 'device_id',
            width: 100,
            align: 'center',
            sorter: (a, b) => a.device_id - b.device_id,
            sortDirections: ['descend', 'ascend'],
            ...getColumnSearchProps('device_id'),
        },
        {
            title: 'Device name',
            dataIndex: 'device_name',
            key: 'device_name',
            align: 'center',
            ellipsis: true,
            sorter: (a, b) => (a.device_name || "").localeCompare(b.device_name || ""),
            sortDirections: ['descend', 'ascend'],
            ...getColumnSearchProps('device_name'),
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            align: 'center',
            // ellipsis: true,
            sorter: (a, b) => (a.category || "").localeCompare(b.category || ""),
            sortDirections: ['descend', 'ascend'],
            ...getColumnSearchProps('category'),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            align: 'center',
            ellipsis: true,
            sorter: (a, b) => (a.status || "").localeCompare(b.status || ""),
            sortDirections: ['descend', 'ascend'],
            ...getColumnSearchProps('status'),
        },
        {
            title: 'Location',
            dataIndex: 'location',
            key: 'location',
            align: 'center',
            render: (text) => text || '-',
            // ellipsis: true,
            sorter: (a, b) => (a.location || "").localeCompare(b.location || ""),
            sortDirections: ['descend', 'ascend'],
            width: 100,
            ...getColumnSearchProps('location'),
        },
        {
            title: 'Purchase Date',
            dataIndex: 'purchase_date',
            key: 'purchase_date',
            width: 120,
            align: 'center',
            // ellipsis: true,
            sorter: (a, b) => (a.purchase_date || "").localeCompare(b.purchase_date || ""),
            sortDirections: ['ascend', 'descend'],
            ...getColumnSearchProps('purchase_date'),
        },
        {
            title: 'Warranty Expiry',
            dataIndex: 'warranty_expiry',
            key: 'warranty_expiry',
            align: 'center',
            // ellipsis: true,
            sorter: (a, b) => (a.warranty_expiry || "").localeCompare(b.warranty_expiry || ""),
            sortDirections: ['ascend', 'descend'],
            ...getColumnSearchProps('warranty_expiry'),
        },
        {
            title: 'Quantity',
            dataIndex: 'quantity',
            key: 'quantity',
            align: 'center',
            ellipsis: true,
            sorter: (a, b) => (a.quantity || "").localeCompare(b.quantity || ""),
            sortDirections: ['ascend', 'descend'],
            ...getColumnSearchProps('quantity'),
        },
        {
            title: t('jobTracker.dept'),
            dataIndex: 'dept_id',
            key: 'dept_id',
            align: 'center',
            ellipsis: true,
            sorter: (a, b) => (a.dept_id || "").localeCompare(b.dept_id || ""),
            sortDirections: ['ascend', 'descend'],
            ...getColumnSearchProps('dept_id'),
        },
        {
            title: t('jobTracker.content'),
            dataIndex: 'content',
            key: 'content',
            align: 'center',
            // ellipsis: true,
            sorter: (a, b) => (a.content || "").localeCompare(b.content || ""),
            sortDirections: ['ascend', 'descend'],
            ...getColumnSearchProps('content'),
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
                                    onClick: () => handleDelete(record.device_id),
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
                    localStorage.removeItem('device');
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
                rowKey={'device_id'}
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
                <DeviceForm
                    visible={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleAdd}
                    modalStyle={{ width: '500px', maxHeight: '80vh' }}
                    mode="add"
                />
            )}
            {editingRecord && (
                <DeviceForm
                    visible={!!editingRecord}
                    onClose={() => setEditingRecord(null)}
                    onSubmit={handleUpdate}
                    initialValues={editingRecord}
                    modalStyle={{ width: '500px', height: '80vh' }}
                    mode="edit"
                />
            )}
            {viewingRecord && (
                <DeviceForm
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

export default Device;
