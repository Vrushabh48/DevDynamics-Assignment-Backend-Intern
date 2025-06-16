"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitSchema = void 0;
const express_1 = __importDefault(require("express"));
const zod_1 = __importDefault(require("zod"));
const prisma_1 = require("../db/src/generated/prisma");
const prisma = new prisma_1.PrismaClient();
const app = (0, express_1.default)();
const port = 3000;
app.use(express_1.default.json());
app.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    return res.status(200).json({ message: "Working!" });
}));
/**Route to List all the Expenses */
app.get('/expenses', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const expenses = yield prisma.expense.findMany();
    res.status(200).json({
        expenses
    });
}));
exports.splitSchema = zod_1.default.object({
    name: zod_1.default.string(),
    splitType: zod_1.default.enum(['equal', 'percentage', 'exact']),
    value: zod_1.default.number().nonnegative(),
});
const expenseData = zod_1.default.object({
    amount: zod_1.default.number(),
    description: zod_1.default.string(),
    paid_by: zod_1.default.string(),
    split: zod_1.default.array(exports.splitSchema).min(1, "At least one Split is Required")
});
/** Route to add new Expense */
app.post('/expenses', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parseResult = expenseData.safeParse(req.body);
        console.log(parseResult);
        if (!parseResult.success) {
            return res.status(400).json({
                message: "Invalid data.",
                errors: parseResult.error.format(),
            });
        }
        const { amount, description, paid_by, split } = parseResult.data;
        const paidByPerson = yield prisma.person.upsert({
            where: { name: paid_by },
            update: {},
            create: { name: paid_by }
        });
        const expense = yield prisma.expense.create({
            data: {
                amount,
                description,
                paidBy: {
                    connect: { id: paidByPerson.id },
                },
            },
        });
        for (const item of split) {
            const splitPerson = yield prisma.person.upsert({
                where: { name: item.name },
                update: {},
                create: { name: item.name }
            });
            yield prisma.expenseSplit.create({
                data: {
                    expenseId: expense.id,
                    personId: splitPerson.id,
                    splitType: item.splitType,
                    value: item.value
                }
            });
        }
        return res.status(201).json({
            success: true,
            message: "Expense Added Successfully!",
            data: expense
        });
    }
    catch (error) {
        console.log(error);
        return res.status(400).json({
            success: false,
            message: 'Error Adding the Expense',
        });
    }
}));
const expenseUpdateSchema = zod_1.default.object({
    amount: zod_1.default.number(),
    description: zod_1.default.string(),
    paid_by: zod_1.default.string(),
    split: zod_1.default.array(exports.splitSchema).min(1, "At least one Split is Required")
});
/** Route to update an expense */
app.put('/expenses/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const expenseId = parseInt(req.params.id);
    if (!expenseId)
        return res.status(400).json({ success: false, message: "Invalid Expense ID" });
    const parseResult = expenseUpdateSchema.safeParse(req.body);
    if (!parseResult.success) {
        return res.status(400).json({
            message: "Invalid data.",
            errors: parseResult.error.format(),
        });
    }
    const { amount, description, paid_by, split } = parseResult.data;
    try {
        const existingExpense = yield prisma.expense.findUnique({
            where: { id: expenseId }
        });
        if (!existingExpense)
            return res.status(404).json({ success: false, message: "Expense Does Not exist." });
        const paidByPerson = yield prisma.person.upsert({
            where: { name: paid_by },
            update: {},
            create: { name: paid_by },
        });
        const updatedExpense = yield prisma.expense.update({
            where: { id: expenseId },
            data: {
                amount,
                description,
                paidById: paidByPerson.id,
            },
        });
        yield prisma.expenseSplit.deleteMany({
            where: { expenseId },
        });
        // Create new splits
        for (const item of split) {
            const splitPerson = yield prisma.person.upsert({
                where: { name: item.name },
                update: {},
                create: { name: item.name },
            });
            yield prisma.expenseSplit.create({
                data: {
                    expenseId,
                    personId: splitPerson.id,
                    splitType: item.splitType,
                    value: item.value,
                },
            });
        }
        return res.status(200).json({
            success: true,
            message: "Expense updated successfully",
            data: updatedExpense,
        });
    }
    catch (error) {
        console.error("Update error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
/** Route to delete an expense */
app.delete('/expenses/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const expenseId = parseInt(req.params.id);
    if (!expenseId)
        return res.status(400).json({ success: false, message: "Invalid Expense ID" });
    try {
        const deletedExpense = yield prisma.expense.delete({
            where: { id: expenseId }
        });
        return res.status(201).json({ success: true, message: "Expense Deleted Successfully." });
    }
    catch (error) {
        console.error("Update error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
/** Route to get Current Settlement Summary */
app.get('/settlements', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const people = yield prisma.person.findMany({
            include: {
                paid: true,
                splits: {
                    include: {
                        expense: {
                            include: {
                                splits: true
                            }
                        }
                    },
                },
            },
        });
        const settlements = people.map(person => {
            // 1. Total paid
            const totalPaid = person.paid.reduce((sum, expense) => {
                return sum + expense.amount.toNumber();
            }, 0);
            // 2. Total owed (fair share)
            const totalOwed = person.splits.reduce((sum, split) => {
                const total = split.expense.amount.toNumber();
                let share = 0;
                if (split.splitType === "equal") {
                    const numPeople = split.expense.splits.length || 1;
                    share = total / numPeople;
                }
                else if (split.splitType === "percentage") {
                    //@ts-ignore
                    share = (split.value / 100) * total;
                }
                else if (split.splitType === "exact") {
                    //@ts-ignore
                    share = split.value; // might also be Decimal
                    if (typeof share !== "number") {
                        //@ts-ignore
                        share = share.toNumber(); // ✅ defensive check
                    }
                }
                return sum + share;
            }, 0);
            return {
                name: person.name,
                paid: parseFloat(totalPaid.toFixed(2)),
                owes: parseFloat(totalOwed.toFixed(2)),
                balance: parseFloat((totalPaid - totalOwed).toFixed(2)),
            };
        });
        res.status(200).json({
            success: true,
            message: "Settlement summary generated",
            data: settlements,
        });
    }
    catch (error) {
        console.error("Settlement error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}));
/** Route to Show each person's balances (owes/owed) */
app.get('/balances', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
}));
/** Route to get list of all people derived from expenses */
app.get('/people', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
}));
app.listen(port, () => {
    console.log(`App is listening on Port ${port}`);
});
