import Department from '../models/Department.js';

const getDepartments = async (req, res) => {
    try{
        const departments = await Department.find( );
        return  res.status(200).json({ success: true, departments });
    }catch{
        return res.status(500).json({ success: false, error: "Get Deprtment Server Error" });
    }
}


const addDepartment = async (req, res) => {
    try{
        const { dep_name, description } = req.body;
        const newDep = new Department({
            dep_name,
            description
        });
        await newDep.save();
        return res.status(201).json({ success: true, department: newDep})
    }
    catch (error) {
        return res.status(500).json({ success: false, error: "Add Deprtment Server Error" });
    }
}

const getDepartment = async (req, res) => {
    try{
        const { id } = req.params;
        const department = await Department.findById({_id: id});
        return  res.status(200).json({ success: true, department });
    }catch{
        return res.status(500).json({ success: false, error: "Edit Deprtment Server Error" });
    }
}

const updateDepartment = async (req, res) => {
    try{
        const { id } = req.params;
        const { dep_name, description } = req.body;
        const updatedDep = await Department.findByIdAndUpdate({_id: id}, {
            dep_name,
            description
        });
        return res.status(200).json({ success: true, department: updatedDep})
    }catch (error) {
        return res.status(500).json({ success: false, error: "Update Deprtment Server Error"
        })
    }
}

const deleteDepartment = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedDep = await Department.findByIdAndDelete(id);

        if (!deletedDep) {
            return res.status(404).json({
                success: false,
                message: "Department not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Department deleted successfully",
            department: deletedDep
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: "Delete Department Server Error"
        });
    }
};


export { addDepartment, getDepartments, getDepartment, updateDepartment, deleteDepartment };