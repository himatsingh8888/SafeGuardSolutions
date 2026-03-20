import { useNavigate } from "react-router-dom";
import './Login.css'

export default function Login() {
  const navigate = useNavigate();

  async function handleLogin(e){
    e.preventDefault()

      const formData = new FormData(e.target)

        const username = formData.get("username")
        const password = formData.get("password")

        console.log(username, password)

        

  }

  return (
      <div className="login-page" style={{ display: "flex", gap: 12 }}>
        <form className= "login-form" onSubmit={handleLogin} >
          <button className="back-btn" onClick={() => navigate('/')}>  &#8592; Back</button>
          <h1>Sign In</h1>
          <p>Access your security dashboard</p>
          <div className="input-box">
            <h4>EMAIL ADDRESS</h4>
            <input type="text" name="username" placeholder="Username" />
          </div>
          <div className="input-box">
            <h4>PASSWORD</h4>
            <input type="password" name="password" placeholder="Password"/>
          </div>
          <button type="submit" className="login-btn">ACCESS DASHBOARD</button>
        </form>
      </div>
 
  )
}