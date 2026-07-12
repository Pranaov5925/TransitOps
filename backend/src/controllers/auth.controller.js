const bcrypt = require("bcryptjs");
const db = require("../config/database");

/**
 * POST /auth/login
 * Body: { email, password, role }
 * Returns the AuthUser shape { email, role } on success.
 */
async function login(req, res) {
  try {
    const { email, password, role } = req.body;

    if (!email || !email.includes("@"))
      return res.status(400).json({ error: "Valid email is required." });
    if (!password) return res.status(400).json({ error: "Password is required." });

    const validRoles = ["Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"];
    if (!role || !validRoles.includes(role))
      return res.status(400).json({ error: "Valid role is required." });

    const [rows] = await db.query("SELECT * FROM auth_users WHERE email = ?", [email]);
    if (rows.length === 0) return res.status(401).json({ error: "Invalid credentials." });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ error: "Invalid credentials." });
    if (user.role !== role)
      return res.status(403).json({ error: "Role mismatch for this account." });

    return res.json({ user: { email: user.email, role: user.role } });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

module.exports = { login };
