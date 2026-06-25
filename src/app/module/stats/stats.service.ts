import status from "http-status";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { PaymentStatus, Role } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";

//Here, the required dashboard data is being determined based on the role.
const getDashboardStatsData = async (user : IRequestUser) => {
    let statsData;

    switch(user.role){
        case Role.SUPER_ADMIN:
            statsData = getSuperAdminStatsData(); //If the Super Admin logs in, `getSuperAdminStatsData()` will run.
            break;
        case Role.ADMIN:
            statsData = getAdminStatsData(); //If the Admin logs in, `getAdminStatsData()` will run.
            break;
        case Role.DOCTOR:
            statsData = getDoctorStatsData(user); //If the Doctor logs in, `getDoctorStatsData()` will run.
            break;
        case Role.PATIENT:
            statsData = getPatientStatsData(user); //If the Patient logs in, `getPatientStatsData()` will run.
            break;
        default:
            throw new AppError(status.BAD_REQUEST, "Invalid user role");
    }

    return statsData;
}

const getSuperAdminStatsData = async () => {
    const appointmentCount = await prisma.appointment.count(); //Total appointment count
    const doctorCount = await prisma.doctor.count();  //Total doctor count
    const patientCount = await prisma.patient.count(); //Total patient count
    const superAdminCount = await prisma.admin.count({ //Total super admin count
        where: {
            user: {
                role: Role.SUPER_ADMIN
            }
        }
    });
    const adminCount = await prisma.admin.count(); //Total admin count
    const paymentCount = await prisma.payment.count(); //Total payment count
    const userCount = await prisma.user.count();//Total user count

    const totalRevenue = await prisma.payment.aggregate({  //It is calculating the total revenue by adding only the amounts from paid payments.
        _sum: { amount: true},
        where:{
            status: PaymentStatus.PAID
        }
    });

    const pieChartData = await getPieChartData();//Calculates the count based on appointment status.
    const barChartData = await getBarChartData(); //It calculates the number of appointments created each month.

    return {
        appointmentCount,
        doctorCount,
        patientCount, 
        superAdminCount,  
        adminCount,
        paymentCount,
        userCount,
        totalRevenue: totalRevenue._sum.amount || 0,
        pieChartData,
        barChartData
    }
}

const getAdminStatsData = async () => {
        const appointmentCount = await prisma.appointment.count();
        const doctorCount = await prisma.doctor.count();
        const patientCount = await prisma.patient.count();
        const paymentCount = await prisma.payment.count();
        const userCount = await prisma.user.count();
        const adminCount = await prisma.admin.count();

        const totalRevenue = await prisma.payment.aggregate({
            _sum: { amount: true},
            where:{
                status: PaymentStatus.PAID
            }
        });

        const pieChartData = await getPieChartData();
        const barChartData = await getBarChartData();

        return {
            appointmentCount,
            doctorCount,
            patientCount,
            paymentCount,
            userCount,
            adminCount,
            totalRevenue: totalRevenue._sum.amount || 0,
            pieChartData,
            barChartData
        }
}

const getDoctorStatsData = async (user : IRequestUser) => {
    const doctorData = await prisma.doctor.findUniqueOrThrow({ //Searching for doctor records using the email obtained from JWT.
        where: {
            email: user.email
        }
    });

    const reviewCount = await prisma.review.count({ //Total number of reviews for the doctor.
        where: {
            doctorId: doctorData.id 
        }
    })

    const patientCount = await prisma.appointment.groupBy({ //Here, unique patients are identified.
        by: ["patientId"],
        _count:{
            id : true
        },
        where: {
            doctorId: doctorData.id
        }
    })

    // const formattedPatientCount = patientCount.map(({_count, patientId}) => ({
    //     patientId,
    //     count: _count.id
    // }));

    const appointmentCount = await prisma.appointment.count({ //Total appointments with the doctor.
        where: {
            doctorId: doctorData.id
        }
    })

    const totalRevenue = await prisma.payment.aggregate({ //How much revenue has been generated from doctor appointments
        _sum: { amount: true},
        where : {
            appointment :{
                doctorId: doctorData.id
            },
            status: PaymentStatus.PAID
        }
    })

//Appointment Status Distribution
    const appointmentStatusDistribution = await prisma.appointment.groupBy({
        by: ["status"],
        _count: {
            id: true
        },
        where: {
            doctorId: doctorData.id
        }
    })

    const formattedAppointmentStatusDistribution = appointmentStatusDistribution.map(({_count, status}) => ({
        status,
        count : _count.id
    }))

    return {
        reviewCount,
        patientCount : patientCount.length,
        appointmentCount,
        totalRevenue: totalRevenue._sum.amount || 0,
        appointmentStatusDistribution: formattedAppointmentStatusDistribution
    }
}

const getPatientStatsData = async (user : IRequestUser) => {
    const patientData = await prisma.patient.findUniqueOrThrow({ //The patient is being located using their email address.
        where: {
            email: user.email
        }
    });

    const appointmentCount = await prisma.appointment.count({ //How many appointments has the patient made?
        where: {
            patientId: patientData.id
        }
    })

    const reviewCount = await prisma.review.count({ //The patient has submitted several reviews.
        where: {
            patientId: patientData.id
        }
    })

    //Appointment Status Distribution
    const appointmentStatusDistribution = await prisma.appointment.groupBy({
        by: ["status"],
        _count: {
            id: true
        },
        where: {
            patientId: patientData.id
        }
    })

    const formattedAppointmentStatusDistribution = appointmentStatusDistribution.map(({_count, status}) => ({
        status,
        count : _count.id
    }))

    return {
        appointmentCount,
        reviewCount,
        appointmentStatusDistribution: formattedAppointmentStatusDistribution
    }
}

//Grouping all appointments according to status.
//It will be used in the frontend Pie Chart.
const getPieChartData = async () => {
    const appointmentStatusDistribution = await prisma.appointment.groupBy({
        by: ["status"],
        _count: {
            id: true
        }
    });

    const formattedAppointmentStatusDistribution = appointmentStatusDistribution.map(({_count, status}) => ({
        status,
        count : _count.id
    }))

    return formattedAppointmentStatusDistribution;
}

//This will be used in the frontend bar chart.
const getBarChartData = async () => {
    interface AppointmentCountByMonth {
        month: Date;
        count: bigint;
    }
    const appointmentCountByMonth : AppointmentCountByMonth[] = await prisma.$queryRaw`
        SELECT DATE_TRUNC('month', "createdAt") AS month,
        CAST(COUNT(*) AS INTEGER) AS count
        FROM "appointments"
        GROUP BY month
        ORDER BY month ASC;
    `

    return appointmentCountByMonth
}


export const StatsService = {
    getDashboardStatsData
}