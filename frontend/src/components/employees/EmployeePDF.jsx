import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#1f2937",
    backgroundColor: "#ffffff",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    marginBottom: 20,
    backgroundColor: "#0080ffff",
    borderRadius: 10,
  },

  headerLeft: {
    width: 90,
  },

  headerCenter: {
    flex: 1,
    alignItems: "center",
  },

  headerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffffff",
  },

  headerDesignation: {
    fontSize: 12,
    color: "#475569",
    marginTop: 4,
  },

  image: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },

  section: {
    marginBottom: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 4,
  },

  row: {
    flexDirection: "row",
    marginBottom: 6,
  },

  label: {
    width: "38%",
    fontWeight: "bold",
  },

  value: {
    width: "62%",
  },
});

const EmployeePDF = ({ employee }) => (
  <Document>
    <Page style={styles.page}>

      {/* Header */}
      <View style={styles.header}>

        {/* Left - Profile Image */}
        <View style={styles.headerLeft}>
          {employee.userId?.profileImage && (
            <Image
              src={`http://localhost:5000/uploads/${employee.userId.profileImage}`}
              style={styles.image}
            />
          )}
        </View>

        {/* Center - Name & Designation */}
        <View style={styles.headerCenter}>
          <Text style={styles.headerName}>{employee.userId?.name}</Text>
          <Text style={styles.headerDesignation}>{employee.designation}</Text>
        </View>

      </View>


      {/* Personal Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Info</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{employee.userId?.name}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>NIC:</Text>
          <Text style={styles.value}>{employee.nic}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{employee.userId?.email}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>DOB:</Text>
          <Text style={styles.value}>{employee.dob?.slice(0, 10)}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Gender:</Text>
          <Text style={styles.value}>{employee.gender}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Marital Status:</Text>
          <Text style={styles.value}>{employee.marital_status}</Text>
        </View>
      </View>

      {/* Job Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Job Info</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Employee ID:</Text>
          <Text style={styles.value}>{employee.employee_id}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Designation:</Text>
          <Text style={styles.value}>{employee.designation}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Department:</Text>
          <Text style={styles.value}>{employee.department?.dep_name}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Joined Date:</Text>
          <Text style={styles.value}>{employee.joined_date?.slice(0, 10)}</Text>
        </View>
      </View>

      {/* Compensation */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Compensation</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Basic Salary:</Text>
          <Text style={styles.value}>Rs. {employee.basic_salary}.00</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Role:</Text>
          <Text style={styles.value}>{employee.userId?.role}</Text>
        </View>
      </View>

      {/* Bank Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bank Details</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Bank Name:</Text>
          <Text style={styles.value}>
            {employee.bank_details?.bank_name || "—"}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Bank Branch:</Text>
          <Text style={styles.value}>
            {employee.bank_details?.bank_branch || "—"}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Account Number:</Text>
          <Text style={styles.value}>
            {employee.bank_details?.bank_account_number || "—"}
          </Text>
        </View>
      </View>

    </Page>
  </Document>
);

export default EmployeePDF;
