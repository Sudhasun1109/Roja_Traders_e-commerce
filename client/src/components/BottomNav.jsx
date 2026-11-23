import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, LayoutGrid, ShoppingBag, Receipt, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { cartTotalQuantity, openCart } = useCart();
  const { isCustomerLoggedIn, customerUser } = useAuth();

  // Hide on admin routes
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-slate-200/90 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5 h-16 max-w-md mx-auto items-center px-1">
        {/* 1. Home */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center h-full py-1 transition-colors ${
              isActive ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Home</span>
        </NavLink>

        {/* 2. Categories */}
        <NavLink
          to="/categories"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center h-full py-1 transition-colors ${
              isActive ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <LayoutGrid className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Categories</span>
        </NavLink>

        {/* 3. Cart with Live Badge */}
        <button
          type="button"
          onClick={openCart}
          className="flex flex-col items-center justify-center h-full py-1 text-slate-500 hover:text-emerald-700 transition-colors relative cursor-pointer"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 mb-0.5" />
            {cartTotalQuantity > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-emerald-600 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs animate-scaleUp">
                {cartTotalQuantity}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">Cart</span>
        </button>

        {/* 4. My Orders */}
        <NavLink
          to="/orders"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center h-full py-1 transition-colors ${
              isActive ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <Receipt className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Orders</span>
        </NavLink>

        {/* 5. Profile / Account */}
        <NavLink
          to={isCustomerLoggedIn ? '/profile' : '/login'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center h-full py-1 transition-colors ${
              isActive ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          {isCustomerLoggedIn ? (
            <div className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px] font-black mb-0.5">
              {customerUser?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          ) : (
            <User className="w-5 h-5 mb-0.5" />
          )}
          <span className="text-[10px] tracking-tight">
            {isCustomerLoggedIn ? (customerUser?.name?.split(' ')[0] || 'Profile') : 'Profile'}
          </span>
        </NavLink>
      </div>
    </nav>
  );
}
