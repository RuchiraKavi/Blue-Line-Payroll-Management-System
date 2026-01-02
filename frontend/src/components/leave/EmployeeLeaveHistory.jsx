import { useParams } from "react-router-dom";
import LeaveList from "./LeaveList.jsx";

const EmployeeLeaveHistory = () => {
  const { employeeId } = useParams();

  return <LeaveList employeeId={employeeId} isAdminView />;
};

export default EmployeeLeaveHistory;
