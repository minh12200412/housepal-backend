// src/repositories/finance.repository.js
import db, { query } from "../config/db.js";
const { pool } = db;
const withTransaction = async (fn) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const getFundSummary = async (houseId, month, year) => {
  const [
    { rows: settingRows },
    { rows: contributionRows },
    { rows: expenseRows },
  ] = await Promise.all([
    query(
      `SELECT id, contribution_amount, contribution_frequency, currency
       FROM fund_settings
       WHERE house_id = $1`,
      [houseId]
    ),
    query(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM fund_contributions
       WHERE house_id = $1 AND month = $2 AND year = $3`,
      [houseId, month, year]
    ),
    query(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM common_fund_expenses
       WHERE house_id = $1
         AND EXTRACT(MONTH FROM expense_date) = $2
         AND EXTRACT(YEAR FROM expense_date) = $3`,
      [houseId, month, year]
    ),
  ]);

  const contributionAmount = settingRows[0]?.contribution_amount || 0;
  const totalContributions = Number(contributionRows[0]?.total || 0);
  const totalExpenses = Number(expenseRows[0]?.total || 0);
  const balance = totalContributions - totalExpenses;

  const { rows: memberStatus } = await query(
    `SELECT
        hm.id AS member_id,
        u.username AS member_name,
        fc.status,
        fc.amount,
        fc.contribution_date::date AS contributed_at,
        fc.note
     FROM house_members hm
     LEFT JOIN users u ON u.id = hm.user_id
     LEFT JOIN fund_contributions fc
       ON fc.house_id = hm.house_id
      AND fc.member_id = hm.id
      AND fc.month = $2
      AND fc.year = $3
     WHERE hm.house_id = $1
     ORDER BY u.username NULLS LAST, hm.id`,
    [houseId, month, year]
  );

  const totalMembers = memberStatus.length;
  const contributedCount = memberStatus.filter(
    (m) => m.status === "contributed"
  ).length;

  return {
    houseId,
    month,
    year,
    contributionAmount,
    totalMembers,
    contributedCount,
    totalContributions,
    totalExpenses,
    currentBalance: balance,
    memberStatus,
  };
};

export const upsertFundSettings = async (
  houseId,
  contributionAmount,
  contributionFrequency
) => {
  const { rows } = await query(
    `INSERT INTO fund_settings (house_id, contribution_amount, contribution_frequency)
     VALUES ($1, $2, $3)
     ON CONFLICT (house_id)
     DO UPDATE SET contribution_amount = EXCLUDED.contribution_amount,
                   contribution_frequency = EXCLUDED.contribution_frequency,
                   updated_at = NOW()
     RETURNING id, house_id, contribution_amount, contribution_frequency, currency, created_at, updated_at`,
    [houseId, contributionAmount, contributionFrequency]
  );
  return rows[0];
};

export const createContribution = async (
  houseId,
  memberId,
  amount,
  month,
  year,
  contributionDate,
  note
) => {
  const { rows } = await query(
    `INSERT INTO fund_contributions (
       house_id,
       member_id,
       amount,
       month,
       year,
       contribution_date,
       status,
       note
     )
     VALUES ($1, $2, $3, $4, $5, $6, 'contributed', $7)
     ON CONFLICT (house_id, member_id, month, year)
     DO UPDATE SET
       amount = EXCLUDED.amount,
       contribution_date = EXCLUDED.contribution_date,
       status = EXCLUDED.status,
       note = EXCLUDED.note,
       updated_at = NOW()
     RETURNING
       id,
       status,
       contribution_date AS contributed_at,
       note`,
    [
      houseId, // $1
      memberId, // $2
      amount, // $3
      month, // $4
      year, // $5
      contributionDate, // $6 -> đúng là contribution_date
      note, // $7 -> note
    ]
  );

  return rows[0];
};

export const listContributions = async (houseId, month, year) => {
  const { rows } = await query(
    `SELECT
        fc.id AS contribution_id,
        fc.member_id,
        u.username AS member_name,
        fc.amount,
        fc.status,
      fc.contribution_date::date AS contributed_at,
      fc.note
     FROM fund_contributions fc
     LEFT JOIN house_members hm ON hm.id = fc.member_id
     LEFT JOIN users u ON u.id = hm.user_id
     WHERE fc.house_id = $1 AND fc.month = $2 AND fc.year = $3
     ORDER BY fc.contribution_date NULLS LAST, fc.created_at DESC`,
    [houseId, month, year]
  );
  return rows;
};

export const createCommonExpense = async (
  houseId,
  paidBy,
  title,
  description,
  amount,
  expenseDate
) => {
  const { rows } = await query(
    `INSERT INTO common_fund_expenses (house_id, paid_by, title, description, amount, expense_date)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, paid_by, title, amount, expense_date, created_at`,
    [houseId, paidBy, title, description, amount, expenseDate]
  );
  return rows[0];
};

export const listCommonExpenses = async (houseId, month, year) => {
  const monthInt = month ? Number(month) : null;
  const yearInt = year ? Number(year) : null;

  const { rows } = await query(
    `SELECT
        cfe.id AS expense_id,
        cfe.house_id,
        cfe.paid_by,
        u.username AS paid_by_name,
        cfe.title,
        cfe.description,
        cfe.amount,
        cfe.expense_date
     FROM common_fund_expenses cfe
     LEFT JOIN house_members hm ON hm.id = cfe.paid_by
     LEFT JOIN users u ON u.id = hm.user_id
     WHERE cfe.house_id = $1
       AND ($2::int IS NULL OR EXTRACT(MONTH FROM cfe.expense_date) = $2::int)
       AND ($3::int IS NULL OR EXTRACT(YEAR  FROM cfe.expense_date) = $3::int)
     ORDER BY cfe.expense_date DESC, cfe.created_at DESC`,
    [houseId, monthInt, yearInt] // 👈 dùng monthInt, yearInt
  );

  return rows;
};

export const deleteCommonExpense = async (houseId, expenseId) => {
  const { rows } = await query(
    `DELETE FROM common_fund_expenses
     WHERE house_id = $1 AND id = $2
     RETURNING id`,
    [houseId, expenseId]
  );
  return rows[0];
};

export const createAdHocExpense = async (
  houseId,
  paidBy,
  title,
  description,
  totalAmount,
  expenseDate,
  category,
  splitMethod,
  receiptImage,
  splits
) => {
  return withTransaction(async (client) => {
    const { rows: expenseRows } = await client.query(
      `INSERT INTO ad_hoc_expenses (house_id, paid_by, title, description, total_amount, expense_date, category, split_method, receipt_image)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        houseId,
        paidBy,
        title,
        description,
        totalAmount,
        expenseDate,
        category,
        splitMethod,
        receiptImage,
      ]
    );
    const expense = expenseRows[0];

    const splitResults = [];
    const debtResults = [];

    for (const split of splits) {
      const { rows: splitRows } = await client.query(
        `INSERT INTO expense_splits (expense_id, member_id, share_percentage, amount_owed)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [
          expense.id,
          split.memberId,
          split.sharePercentage || 0,
          split.amountOwed,
        ]
      );
      const splitRow = splitRows[0];
      splitResults.push(splitRow);

      if (split.memberId !== paidBy) {
        const { rows: debtRows } = await client.query(
          `INSERT INTO debt_records (house_id, debtor_id, creditor_id, amount, from_expense_id, status)
           VALUES ($1, $2, $3, $4, $5, 'pending')
           RETURNING *`,
          [houseId, split.memberId, paidBy, split.amountOwed, expense.id]
        );
        debtResults.push(debtRows[0]);
      }
    }

    return { expense, splits: splitResults, debts: debtResults };
  });
};

export const listAdHocExpenses = async (houseId, month, year) => {
  // Ép kiểu an toàn
  const monthInt = month ? Number(month) : null;
  const yearInt = year ? Number(year) : null;

  const { rows: expenses } = await query(
    `SELECT 
        ahe.*,
        u.username AS paid_by_name
     FROM ad_hoc_expenses ahe
     LEFT JOIN house_members hm ON hm.id = ahe.paid_by
     LEFT JOIN users u ON u.id = hm.user_id
     WHERE ahe.house_id = $1
       AND ($2::int IS NULL OR EXTRACT(MONTH FROM ahe.expense_date) = $2::int)
       AND ($3::int IS NULL OR EXTRACT(YEAR  FROM ahe.expense_date)  = $3::int)
     ORDER BY ahe.expense_date DESC, ahe.created_at DESC`,
    [houseId, monthInt, yearInt]
  );

  if (expenses.length === 0) return [];

  const expenseIds = expenses.map((e) => e.id);

  const { rows: splits } = await query(
    `SELECT 
        es.*,
        u.username AS member_name
     FROM expense_splits es
     LEFT JOIN house_members hm ON hm.id = es.member_id
     LEFT JOIN users u ON u.id = hm.user_id
     WHERE es.expense_id = ANY($1::int[])`,
    [expenseIds]
  );

  const grouped = expenses.map((exp) => ({
    ...exp,
    splits: splits.filter((s) => s.expense_id === exp.id),
  }));

  return grouped;
};

export const updateAdHocExpense = async (houseId, expenseId, payload) => {
  return withTransaction(async (client) => {
    const { rows: paymentCheck } = await client.query(
      `SELECT 1
       FROM debt_payments dp
       JOIN debt_records dr ON dr.id = dp.debt_id
       WHERE dr.from_expense_id = $1
       LIMIT 1`,
      [expenseId]
    );
    if (paymentCheck.length > 0) {
      const err = new Error("Không thể cập nhật vì đã có thanh toán liên quan");
      err.status = 400;
      throw err;
    }

    const { rows: expenseRows } = await client.query(
      `UPDATE ad_hoc_expenses
         SET title = COALESCE($3, title),
             description = COALESCE($4, description),
             total_amount = COALESCE($5, total_amount),
             expense_date = COALESCE($6, expense_date),
             category = COALESCE($7, category),
             split_method = COALESCE($8, split_method),
             receipt_image = COALESCE($9, receipt_image),
             updated_at = NOW()
       WHERE house_id = $1 AND id = $2
       RETURNING *`,
      [
        houseId,
        expenseId,
        payload.title,
        payload.description,
        payload.totalAmount,
        payload.expenseDate,
        payload.category,
        payload.splitMethod,
        payload.receiptImage,
      ]
    );

    if (expenseRows.length === 0) return null;
    const expense = expenseRows[0];

    await client.query(`DELETE FROM debt_records WHERE from_expense_id = $1`, [
      expenseId,
    ]);
    await client.query(`DELETE FROM expense_splits WHERE expense_id = $1`, [
      expenseId,
    ]);

    const splitResults = [];
    const debtResults = [];

    for (const split of payload.splits || []) {
      const { rows: splitRows } = await client.query(
        `INSERT INTO expense_splits (expense_id, member_id, share_percentage, amount_owed)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [
          expense.id,
          split.memberId,
          split.sharePercentage || 0,
          split.amountOwed,
        ]
      );
      const splitRow = splitRows[0];
      splitResults.push(splitRow);

      if (split.memberId !== expense.paid_by) {
        const { rows: debtRows } = await client.query(
          `INSERT INTO debt_records (house_id, debtor_id, creditor_id, amount, from_expense_id, status)
           VALUES ($1, $2, $3, $4, $5, 'pending')
           RETURNING *`,
          [
            houseId,
            split.memberId,
            expense.paid_by,
            split.amountOwed,
            expense.id,
          ]
        );
        debtResults.push(debtRows[0]);
      }
    }

    return { expense, splits: splitResults, debts: debtResults };
  });
};

export const deleteAdHocExpense = async (houseId, expenseId) => {
  return withTransaction(async (client) => {
    const { rows: paymentCheck } = await client.query(
      `SELECT 1
       FROM debt_payments dp
       JOIN debt_records dr ON dr.id = dp.debt_id
       WHERE dr.from_expense_id = $1
       LIMIT 1`,
      [expenseId]
    );
    if (paymentCheck.length > 0) {
      const err = new Error("Không thể xóa vì đã có thanh toán liên quan");
      err.status = 400;
      throw err;
    }

    await client.query(`DELETE FROM debt_records WHERE from_expense_id = $1`, [
      expenseId,
    ]);
    const { rows } = await client.query(
      `DELETE FROM ad_hoc_expenses
       WHERE house_id = $1 AND id = $2
       RETURNING id`,
      [houseId, expenseId]
    );
    return rows[0];
  });
};

export const listDebtsByMember = async (houseId, memberId, status) => {
  const params = [houseId];
  const filters = ["dr.house_id = $1"];

  if (memberId) {
    params.push(memberId);
    filters.push(`dr.debtor_id = $${params.length}`);
  }
  if (status) {
    params.push(status);
    filters.push(`dr.status = $${params.length}`);
  }

  const whereClause = filters.join(" AND ");

  const { rows } = await query(
    `SELECT
        dr.id AS debt_id,
        dr.debtor_id,
        udeb.username AS debtor_name,
        dr.creditor_id,
        ucred.username AS creditor_name,
        dr.amount AS original_amount,
        dr.status,
        dr.created_at,
        ahe.title AS from_expense,
        COALESCE(SUM(CASE WHEN dp.confirmed IS NULL OR dp.confirmed = TRUE THEN dp.amount_paid ELSE 0 END), 0) AS paid_amount,
        dr.amount - COALESCE(SUM(CASE WHEN dp.confirmed IS NULL OR dp.confirmed = TRUE THEN dp.amount_paid ELSE 0 END), 0) AS remaining_amount
     FROM debt_records dr
     LEFT JOIN house_members hmd ON hmd.id = dr.debtor_id
     LEFT JOIN users udeb ON udeb.id = hmd.user_id
     LEFT JOIN house_members hmc ON hmc.id = dr.creditor_id
     LEFT JOIN users ucred ON ucred.id = hmc.user_id
     LEFT JOIN ad_hoc_expenses ahe ON ahe.id = dr.from_expense_id
     LEFT JOIN debt_payments dp ON dp.debt_id = dr.id
     WHERE ${whereClause}
     GROUP BY dr.id, dr.debtor_id, udeb.username, dr.creditor_id, ucred.username, dr.amount, dr.status, dr.created_at, ahe.title
     ORDER BY dr.created_at DESC`,
    params
  );

  const totalOwed = rows.reduce(
    (sum, r) => sum + Number(r.remaining_amount || 0),
    0
  );
  return { memberId, totalOwed, debts: rows };
};

export const getDebtSummary = async (houseId) => {
  const { rows } = await query(
    `SELECT
        dr.debtor_id,
        udeb.username AS debtor_name,
        dr.creditor_id,
        ucred.username AS creditor_name,
        SUM(dr.amount) AS original_amount,
        SUM(dr.amount - COALESCE(paid.total_paid, 0)) AS remaining_amount,
        MIN(dr.status) AS status
     FROM debt_records dr
     LEFT JOIN house_members hmd ON hmd.id = dr.debtor_id
     LEFT JOIN users udeb ON udeb.id = hmd.user_id
     LEFT JOIN house_members hmc ON hmc.id = dr.creditor_id
     LEFT JOIN users ucred ON ucred.id = hmc.user_id
     LEFT JOIN (
        SELECT debt_id, SUM(CASE WHEN confirmed IS NULL OR confirmed = TRUE THEN amount_paid ELSE 0 END) AS total_paid
        FROM debt_payments
        GROUP BY debt_id
     ) paid ON paid.debt_id = dr.id
     WHERE dr.house_id = $1
     GROUP BY dr.debtor_id, udeb.username, dr.creditor_id, ucred.username
     HAVING SUM(dr.amount - COALESCE(paid.total_paid, 0)) > 0
     ORDER BY debtor_name, creditor_name`,
    [houseId]
  );

  return rows.map((r) => ({
    debtor: { memberId: r.debtor_id, memberName: r.debtor_name },
    creditor: { memberId: r.creditor_id, memberName: r.creditor_name },
    totalOwed: Number(r.original_amount || 0),
    paidAmount:
      Number(r.original_amount || 0) - Number(r.remaining_amount || 0),
    remainingAmount: Number(r.remaining_amount || 0),
    status: r.status,
  }));
};

export const createDebtPayment = async (
  houseId,
  debtId,
  amountPaid,
  paymentDate,
  paymentMethod,
  note,
  proofImage
) => {
  return withTransaction(async (client) => {
    const { rows: debtRows } = await client.query(
      `SELECT * FROM debt_records WHERE id = $1 AND house_id = $2 FOR UPDATE`,
      [debtId, houseId]
    );
    if (debtRows.length === 0) {
      const err = new Error("Không tìm thấy khoản nợ");
      err.status = 404;
      throw err;
    }
    const debt = debtRows[0];

    const { rows: paymentRows } = await client.query(
      `INSERT INTO debt_payments (debt_id, amount_paid, payment_date, payment_method, note, proof_image, confirmed)
       VALUES ($1, $2, $3, $4, $5, $6, FALSE)
       RETURNING *`,
      [debtId, amountPaid, paymentDate, paymentMethod, note, proofImage]
    );

    const { rows: aggRows } = await client.query(
      `SELECT
          dr.amount AS original_amount,
          COALESCE(SUM(CASE WHEN dp.confirmed IS NULL OR dp.confirmed = TRUE THEN dp.amount_paid ELSE 0 END), 0) AS total_paid
       FROM debt_records dr
       LEFT JOIN debt_payments dp ON dp.debt_id = dr.id
       WHERE dr.id = $1
       GROUP BY dr.amount`,
      [debtId]
    );

    const originalAmount = Number(aggRows[0]?.original_amount || 0);
    const totalPaid = Number(aggRows[0]?.total_paid || 0);
    const remaining = Math.max(originalAmount - totalPaid, 0);
    const newStatus = remaining === 0 ? "settled" : "partial_paid";

    await client.query(
      `UPDATE debt_records
         SET status = $2,
             updated_at = NOW()
       WHERE id = $1`,
      [debtId, newStatus]
    );

    const updated = { ...debt, status: newStatus };
    return {
      payment: paymentRows[0],
      debt: { ...updated, remaining_amount: remaining },
    };
  });
};

export const confirmDebtPayment = async (
  paymentId,
  confirmed,
  note,
  confirmerId
) => {
  const { rows } = await query(
    `UPDATE debt_payments
        SET confirmed = $2,
            confirmed_by = $3,
            confirmed_at = CASE WHEN $2 = TRUE THEN NOW() ELSE NULL END,
            note = COALESCE($4, note)
      WHERE id = $1
      RETURNING *`,
    [paymentId, confirmed, confirmerId || null, note]
  );
  return rows[0];
};

export const listDebtPayments = async (houseId, debtId) => {
  const { rows } = await query(
    `SELECT dp.*,
            u.username AS confirmed_by_name
     FROM debt_payments dp
     JOIN debt_records dr ON dr.id = dp.debt_id
     LEFT JOIN house_members hm ON hm.id = dp.confirmed_by
     LEFT JOIN users u ON u.id = hm.user_id
     WHERE dr.house_id = $1 AND dp.debt_id = $2
     ORDER BY dp.payment_date DESC, dp.created_at DESC`,
    [houseId, debtId]
  );
  return rows;
};

export const getFundHistory = async (houseId, month, year, type) => {
  const params = [houseId];
  const filters = ["fh.house_id = $1"];

  if (month) {
    params.push(month);
    filters.push(`EXTRACT(MONTH FROM fh.created_at) = $${params.length}`);
  }
  if (year) {
    params.push(year);
    filters.push(`EXTRACT(YEAR FROM fh.created_at) = $${params.length}`);
  }
  if (type) {
    params.push(type);
    filters.push(`fh.type = $${params.length}`);
  }

  const whereClause = filters.join(" AND ");

  const { rows } = await query(
    `SELECT fh.*, u.username AS member_name
     FROM fund_history fh
     LEFT JOIN house_members hm ON hm.id = fh.member_id
     LEFT JOIN users u ON u.id = hm.user_id
     WHERE ${whereClause}
     ORDER BY fh.created_at DESC`,
    params
  );
  return rows;
};

export const getExpenseStatistics = async (houseId, month, year) => {
  const monthInt = month ? Number(month) : null;
  const yearInt = year ? Number(year) : null;

  const [totalCommonResult, byCategoryResult, byMemberResult] =
    await Promise.all([
      query(
        `SELECT COALESCE(SUM(amount), 0) AS total
       FROM common_fund_expenses
       WHERE house_id = $1
         AND ($2::int IS NULL OR EXTRACT(MONTH FROM expense_date) = $2::int)
         AND ($3::int IS NULL OR EXTRACT(YEAR FROM expense_date) = $3::int)`,
        [houseId, monthInt, yearInt]
      ),
      query(
        `SELECT category, COALESCE(SUM(amount), 0) AS total
       FROM common_fund_expenses
       WHERE house_id = $1
         AND ($2::int IS NULL OR EXTRACT(MONTH FROM expense_date) = $2::int)
         AND ($3::int IS NULL OR EXTRACT(YEAR FROM expense_date) = $3::int)
       GROUP BY category`,
        [houseId, monthInt, yearInt]
      ),
      query(
        `SELECT u.username AS member_name, COALESCE(SUM(cfe.amount), 0) AS total
       FROM common_fund_expenses cfe
       LEFT JOIN house_members hm ON hm.id = cfe.paid_by
       LEFT JOIN users u ON u.id = hm.user_id
       WHERE cfe.house_id = $1
         AND ($2::int IS NULL OR EXTRACT(MONTH FROM cfe.expense_date) = $2::int)
         AND ($3::int IS NULL OR EXTRACT(YEAR FROM cfe.expense_date) = $3::int)
       GROUP BY u.username`,
        [houseId, monthInt, yearInt]
      ),
    ]);

  const byCategory = byCategoryResult.rows.reduce((acc, row) => {
    acc[row.category || "unknown"] = Number(row.total || 0);
    return acc;
  }, {});
  const byMember = byMemberResult.rows.reduce((acc, row) => {
    acc[row.member_name || "unknown"] = Number(row.total || 0);
    return acc;
  }, {});

  return {
    totalCommonExpenses: Number(totalCommonResult.rows[0]?.total || 0),
    byCategory,
    byMember,
  };
};

export const getQuarterlySummary = async (houseId) => {
  const { rows } = await query(
    `WITH months AS (
        SELECT date_trunc('month', CURRENT_DATE) - (INTERVAL '1 month' * g.i) AS month_start
        FROM generate_series(0, 2) AS g(i)
     )
     SELECT
        EXTRACT(MONTH FROM m.month_start)::int AS month,
        EXTRACT(YEAR FROM m.month_start)::int AS year,
        COALESCE((
          SELECT SUM(amount) FROM fund_contributions fc
          WHERE fc.house_id = $1 AND fc.month = EXTRACT(MONTH FROM m.month_start)::int AND fc.year = EXTRACT(YEAR FROM m.month_start)::int
        ), 0) AS total_contributions,
        COALESCE((
          SELECT SUM(amount) FROM common_fund_expenses cfe
          WHERE cfe.house_id = $1 AND EXTRACT(MONTH FROM cfe.expense_date) = EXTRACT(MONTH FROM m.month_start) AND EXTRACT(YEAR FROM cfe.expense_date) = EXTRACT(YEAR FROM m.month_start)
        ), 0) AS total_expenses
     FROM months m
     ORDER BY m.month_start DESC`,
    [houseId]
  );

  return rows.map((row) => ({
    month: row.month,
    year: row.year,
    totalContributions: Number(row.total_contributions || 0),
    totalExpenses: Number(row.total_expenses || 0),
    balance:
      Number(row.total_contributions || 0) - Number(row.total_expenses || 0),
  }));
};
