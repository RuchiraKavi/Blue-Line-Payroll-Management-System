import React, { useMemo } from "react";
import { Page, Text, View, Document, Image, StyleSheet } from "@react-pdf/renderer";
import QRCode from "qrcode";

// ===== Styles =====
const styles = StyleSheet.create({
  page: { width: 208, height: 330, backgroundColor: "#fff", padding: 0 },
  card: { width: "100%", height: "100%", backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: "#e5e7eb", padding: 14, position: "relative", overflow: "hidden", flexDirection: "column" },
  cardAccent: { position: "absolute", top: 0, left: 0, right: 0, height: 5, backgroundColor: "#2563eb" },
  header: { flexDirection: "column", alignItems: "center", marginBottom: 12 },
  profileSection: { flexDirection: "column", alignItems: "center", marginBottom: 10 },
  profileImageContainer: { position: "relative", marginBottom: 6 },
  profileImage: { width: 60, height: 70, borderRadius: 30, borderWidth: 2, borderColor: "#f3f4f6", backgroundColor: "#fff" },
  employeeInfo: { alignItems: "center" },
  employeeName: { fontSize: 14, fontWeight: "bold", color: "#111827", marginBottom: 2 },
  designation: { fontSize: 10, color: "#6b7280", fontWeight: "medium", marginBottom: 2, textTransform: "uppercase" },
  employeeId: { fontSize: 9, color: "#374151", backgroundColor: "#f9fafb", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3, marginTop: 2 },
  qrSection: { alignItems: "center", marginTop: 10 },
  qrContainer: { backgroundColor: "#fff", padding: 5, borderRadius: 5, borderWidth: 1, borderColor: "#e5e7eb" },
  qr: { width: 80, height: 80 },
  detailsSection: { marginTop: 12, borderTopWidth: 1, borderTopColor: "#f3f4f6", paddingTop: 8 },
  detailRow: { flexDirection: "row", marginBottom: 5 },
  detailLabel: { fontSize: 9, color: "#6b7280", width: 80, fontWeight: "medium" },
  detailValue: { fontSize: 9, color: "#111827", flex: 1 },
  footer: { flexDirection: "column", alignItems: "center", marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#f3f4f6" },
  companyName: { fontSize: 10, fontWeight: "bold", color: "#111827" },
  companyTagline: { fontSize: 7, color: "#6b7280", marginTop: 2 },
  issueDate: { fontSize: 7, color: "#6b7280", marginTop: 2 },
});

// ===== Utility =====
const getOneYearFromDate = (date) => {
  const newDate = new Date(date);
  newDate.setFullYear(newDate.getFullYear() + 1);
  return newDate;
};

// ===== ID Card Component =====
const IDCard = ({ employee, qrCode, issueDate, validUntil }) => {
  const formatDate = (date) => date ? new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "N/A";

  return (
    <View style={styles.card}>
      <View style={styles.cardAccent} />
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Image
              src={employee.userId?.profileImage ? `http://localhost:5000/uploads/${employee.userId.profileImage}` : "https://via.placeholder.com/60"}
              style={styles.profileImage}
            />
          </View>
          <View style={styles.employeeInfo}>
            <Text style={styles.employeeName}>{employee.userId?.name?.toUpperCase() || "EMPLOYEE NAME"}</Text>
            <Text style={styles.designation}>{employee.designation || "DESIGNATION"}</Text>
          </View>
        </View>
        <View style={styles.qrSection}>
          <View style={styles.qrContainer}>
            {qrCode ? <Image src={qrCode} style={styles.qr} /> : <View style={{ width: 80, height: 80, backgroundColor: "#f3f4f6" }} />}
          </View>
        </View>
      </View>

      <View style={styles.detailsSection}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>EMP ID:</Text>
          <Text style={styles.detailValue}>{employee.userId?.employee_id || employee.employee_id || "Not Assigned"}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Department:</Text>
          <Text style={styles.detailValue}>{employee.department?.dep_name || "Not Assigned"}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.companyName}>BLUE LINE PRIVATE LIMITED</Text>
        <Text style={styles.companyTagline}>Building Excellence Since 2010</Text>
        <Text style={styles.issueDate}>Issued: {formatDate(issueDate)}</Text>
        <Text style={styles.issueDate}>Valid until: {formatDate(validUntil)}</Text>
      </View>
    </View>
  );
};

// ===== Main PDF Component =====
const EmployeeIDCardPDF = ({ employee }) => {
  const issueDate = new Date();
  const validUntil = getOneYearFromDate(issueDate);

  // Generate QR synchronously using useMemo
  const qrCode = useMemo(() => {
    if (!employee?._id) return null;
    try {
      // Convert async to sync using toDataURLSync helper
      let qr = null;
      QRCode.toDataURL(`http://localhost:5173/employees/${employee._id}`, { width: 180, margin: 0, color: { dark: "#111827", light: "#FFFFFF" } }, (err, url) => {
        if (!err) qr = url;
      });
      return qr;
    } catch (err) {
      console.error("QR generation error:", err);
      return null;
    }
  }, [employee]);

  const safeEmployee = employee || { userId: {}, department: {}, designation: "N/A" };

  return (
    <Document>
      <Page size={[208, 330]} style={styles.page}>
        <IDCard employee={safeEmployee} qrCode={qrCode} issueDate={issueDate} validUntil={validUntil} />
      </Page>
    </Document>
  );
};

export default EmployeeIDCardPDF;
