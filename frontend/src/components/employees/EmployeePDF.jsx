import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#1f2937",
    backgroundColor: "#ffffff",
  },

  /* ===== Header ===== */
  header: {
    alignItems: "center",
    padding: 20,
    marginBottom: 20,
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
  },

  headerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    marginTop: 8,
  },

  headerDesignation: {
    fontSize: 12,
    color: "#475569",
    marginTop: 4,
  },

  /* ===== Profile Image ===== */
  image: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },

  /* ===== Sections ===== */
  section: {
    marginBottom: 18,
    padding: 14,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  sectionTitle: {
    fontSize: 12.5,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 10,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  row: {
    flexDirection: "row",
    marginBottom: 6,
  },
  label: {
    width: "38%",
    fontSize: 10.5,
    fontWeight: "bold",
    color: "#374151",
  },
  value: {
    width: "62%",
    fontSize: 10.5,
    color: "#1f2937",
  },

  salary: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#047857",
  },
});



const EmployeePDF = ({ employee }) => (
  <Document>
    <Page style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerName}>{employee.userId?.name}</Text>
        <Text style={styles.headerDesignation}>{employee.designation}</Text>
      </View>

      {/* Profile Image */}
      {employee.userId?.profileImage && (
        <Image
          src={`http://localhost:5000/uploads/${employee.userId.profileImage}`}
          style={styles.image}
        />
      )}

      {/* Personal Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Info</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Name:</Text>
          <Text>{employee.userId?.name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Email:</Text>
          <Text>{employee.userId?.email}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>DOB:</Text>
          <Text>{employee.dob?.slice(0, 10)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Gender:</Text>
          <Text>{employee.gender}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Marital Status:</Text>
          <Text>{employee.marital_status}</Text>
        </View>
      </View>

      {/* Job Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Job Info</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Employee ID:</Text>
          <Text>{employee.employee_id}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Designation:</Text>
          <Text>{employee.designation}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Department:</Text>
          <Text>{employee.department?.dep_name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Joined Date:</Text>
          <Text>{employee.joined_date?.slice(0, 10)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Resigned Date:</Text>
          <Text>
            {employee.resigned_date
              ? employee.resigned_date.slice(0, 10)
              : "Still Working"}
          </Text>
        </View>
      </View>

      {/* Compensation */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Compensation</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Basic Salary:</Text>
          <Text>Rs. {employee.basic_salary}.00</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Role:</Text>
          <Text>{employee.userId?.role}</Text>
        </View>
      </View>
    </Page>
  </Document>
);

export default EmployeePDF;
