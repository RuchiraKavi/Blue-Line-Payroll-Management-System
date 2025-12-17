import React, { useEffect, useState } from "react";
import {
  Page,
  Text,
  View,
  Document,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import QRCode from "qrcode";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    padding: 16,
    width: 300,
    height: 200,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },

  nameSection: {
    marginLeft: 10,
    flex: 1,
  },

  name: {
    fontSize: 12,
    fontWeight: "bold",
  },

  designation: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 2,
  },

  info: {
    fontSize: 10,
    marginTop: 4,
  },

  qr: {
    width: 55,
    height: 55,
    marginTop: 6,
  },

  footer: {
    fontSize: 8,
    color: "#6b7280",
    textAlign: "right",
    marginTop: 6,
  },
});

const EmployeeIDCardPDF = ({ employee }) => {
  const [qrCode, setQrCode] = useState(null);

  useEffect(() => {
    const generateQR = async () => {
      const qrData = `http://localhost:5173/employees/${employee._id}`;
      const qrImage = await QRCode.toDataURL(qrData);
      setQrCode(qrImage);
    };

    generateQR();
  }, [employee]);

  return (
    <Document>
      <Page size={[300, 200]} style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            src={`http://localhost:5000/uploads/${employee.userId?.profileImage}`}
            style={styles.profileImage}
          />

          <View style={styles.nameSection}>
            <Text style={styles.name}>{employee.userId?.name}</Text>
            <Text style={styles.designation}>{employee.designation}</Text>
          </View>

          {qrCode && <Image src={qrCode} style={styles.qr} />}
        </View>

        {/* Info */}
        <Text style={styles.info}>Employee ID: {employee.employee_id}</Text>
        <Text style={styles.info}>
          Department: {employee.department?.dep_name}
        </Text>

        <Text style={styles.footer}>Blue Line Pvt Ltd</Text>
      </Page>
    </Document>
  );
};

export default EmployeeIDCardPDF;
