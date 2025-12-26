import Login from "./login/login";
import Registration from "./login/registration";
import AdminDashboard from "./dashboards/admins/admin_dashboard";
import CustomerDashboard from "./dashboards/customers/customer_dashboard";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Footer from "./footer/footer";
import Products from "./dashboards/customers/products";

function App() {
  return (
    <Router>
      <div>
        {/* Routes setup */}
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/registration" element={<Registration />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/customer/dashboard" element={<CustomerDashboard />} />
          <Route path="/products" element={<Products />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
