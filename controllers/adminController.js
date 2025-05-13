const jwt = require('jsonwebtoken')

exports.loginAdmin = (req, res) => {
  const { email, password } = req.body

  if (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: '2h',
    })

    return res.json({ token })
  }

  return res.status(401).json({ error: 'Invalid credentials' })
}
