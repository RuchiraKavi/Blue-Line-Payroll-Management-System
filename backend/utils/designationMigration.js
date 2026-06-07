import Designation from "../models/Designation.js";
import DepartmentDesignation from "../models/DepartmentDesignation.js";

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

let migrationDone = false;

export const migrateLegacyDesignations = async () => {
  if (migrationDone) return;

  const legacy = await Designation.collection
    .find({ department: { $exists: true, $ne: null } })
    .toArray();

  if (legacy.length === 0) {
    migrationDone = true;
    return;
  }

  for (const doc of legacy) {
    const title = String(doc.title || "").trim();
    const departmentId = doc.department;
    if (!title || !departmentId) continue;

    let master = await Designation.findOne({
      title: { $regex: new RegExp(`^${escapeRegex(title)}$`, "i") },
    });

    if (master?.department) {
      master = null;
    }

    if (!master) {
      const cleanDoc = await Designation.collection.findOne({
        title: { $regex: new RegExp(`^${escapeRegex(title)}$`, "i") },
        department: { $exists: false },
      });
      if (cleanDoc) {
        master = await Designation.findById(cleanDoc._id);
      }
    }

    if (!master) {
      master = await Designation.create({ title });
    }

    await DepartmentDesignation.findOneAndUpdate(
      { department: departmentId, designation: master._id },
      { department: departmentId, designation: master._id },
      { upsert: true, new: true }
    );

    await Designation.collection.deleteOne({ _id: doc._id });
  }

  migrationDone = true;
};
