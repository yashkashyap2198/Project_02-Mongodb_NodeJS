//No need to change code other than the last four methods
import { getClient, getDB } from '../../config/mongodb.js';

const collectionName = 'students';

class studentRepository {


    async addStudent(studentData) {
        const db = getDB();
        await db.collection(collectionName).insertOne(studentData);
    }

    async getAllStudents() {
        const db = getDB();
        const students = await db.collection(collectionName).find({}).toArray();
        return students;
    }


    //You need to implement methods below:

    async createIndexes() {
        const db = getDB();
        await db.collection(collectionName).createIndexes({ name: 1 })   //singlefield indexes based on 'name'
        await db.collection(collectionName).createIndexes({ age: 1, name: -1 }) //compound indexes
    }

    async getStudentsWithAverageScore() {
        const db = getDB();
        const pipeLine = [{
            $project: {
                name: 1,
                averageScore: { $avg: '$assignment.score' },
            },
        }]
        const result = await db.collection(collectionName).aggregate(pipeLine).toArray();
        return result;
    }

    async getQualifiedStudentsCount() {
        const db = getDB();
        const criteria = {
            age: { $gt: 9 },
            grade: { $lte: 'B' },
            'assignments.title': 'math',
            'assingnments.score': '{$gte:60}',
        }
        const count = await db.collection(collectionName).countDocument(criteria);
        return count;
    }

    async updateStudentGrade() { 
        const db=getDB();
        const session=await getClient().startSession();
        session.startTransaction();
        try{
            const students=db.collection(collectionName).find({}).toArray();
            for(let student of students){
                const averageScore=student.assignments.reduce(
                    (sum,assignment)=>sum+assignment.score,0)/student.assignments.length;
                    let newGrade;
                    if(averageScore>=90) newGrade='A';
                    else if(averageScore>=80) newGrade='B';
                    else if(averageScore>=70) newGrade='C';
                    else if(averageScore>=60) newGrade='D';
                    else newGrade='F'
                    await db.collection(collectionName).updateOne(
                        {_id:student._id},
                        {$set:{grade:newGrade}},
                        {session}
                    );
            }
            await session.commitTransaction();
            session.endSession();
        }catch(err){
            await session.abortTransaction();
            session.endSession();
            console.log(err);
        }
    }

};

export default studentRepository;
