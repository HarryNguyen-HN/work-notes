
import { Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import Home2 from '../pages/Home2';
import About from '../pages/About';
import Dashboard from '../pages/dashboard/Dashboard';
import AppLayout from './AppLayout';
import JobTracker from '../pages/job_tracker/JobTracker';
import HandlerManager from '../pages/handler/HandlerManager';
import Error from '../pages/Error';
import Dept from '../pages/dept/Dept';
import Notification from '../components/notification/Notification';
import Member from '../pages/member/Member';
import MISArchive from '../pages/mis_archive/MISArchive';
import Device from '../pages/device/Device';

const AppRouter = () => {
  return (
    <Routes>
      {/* Navbar Layout */}

      <Route path="/" element={<AppLayout />}>

        <Route index path="/" element={<Home />} />
        <Route path="home2" element={<Home2 />} />
        <Route path="about" element={<About />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="job-tracker" element={<JobTracker />} />
        <Route path="member" element={<Member />} />
        <Route path="handler" element={<HandlerManager />} />
        <Route path="dept" element={<Dept />} />
        <Route path="mis-storage" element={<MISArchive />} />
        <Route path="device" element={<Device />} />

        <Route path="test" element={<Notification />} />
        {/* <Route path="type-abnormal" element={<JobTracker />} /> */}

        <Route path="*" element={<Error title="404 Not Found" subTitle="This page is under development." />} />
        {/* Sidebar Layout */}
        {/* <Route path="/v2" element={<SidebarLayout />}>
          <Route index element={<Home2 />} />
          <Route path="about" element={<About />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="job-tracker" element={<JobTracker />} />
        </Route> */}
      </Route>
    </Routes>
  );
};

export default AppRouter;