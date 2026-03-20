import { useNavigate } from "react-router-dom";
import './Login.css'

export default function Login() {
  const navigate = useNavigate();

  async function handleLogin(e){
    e.preventDefault()

      const formData = new FormData(e.target)

        const username = formData.get("username")
        const password = formData.get("password")
      try{
        const res = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers:{
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({username, password})
        })
        console.log(username, password)
        
        const data = await res.json()

        if(res.ok){
          //also save the token sent from the backend
          localStorage.setItem('token', data.token)
          if(data.role=='admin'){
            navigate('/admin/dashboard')
          }
          if(data.role=='technician'){
            navigate('/tech/dashboard')
          }
          if(data.role=='client'){
            navigate('/client/dashboard')
          }
          console.log('succesfully logged in')
          console.log({token: data.token, role: data.role})
          

        }else{
          console.log('login error')
          console.log(data.message)
        }
      }catch(err){
        console.log(err)
      }
        

        

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