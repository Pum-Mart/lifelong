'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Course, Enrollment, CartItem, SessionUser, Payment } from '@/types';

interface AppContextType {
  currentUser: SessionUser | null;
  authReady: boolean; // false until the session check has finished
  login: (email: string, password: string) => Promise<string | null>; // error message or null
  signup: (name: string, email: string, password: string, joinMembership: boolean) => Promise<string | null>;
  logout: () => Promise<void>;
  setCurrentUser: (user: SessionUser | null) => void;
  requireLogin: () => boolean; // sends guests to /login and returns false
  cart: CartItem[];
  addToCart: (course: Course) => void;
  removeFromCart: (courseId: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  textSize: 'normal' | 'large' | 'xlarge';
  setTextSize: (size: 'normal' | 'large' | 'xlarge') => void;
  bookmarks: string[];
  toggleBookmark: (courseId: string) => void;
  enrollments: Enrollment[];
  refreshEnrollments: () => Promise<void>;
  enrollInCourse: (course: Course) => Promise<boolean>;
  payments: Payment[];
  pendingCourseIds: string[];
  refreshPayments: () => Promise<void>;
  checkoutCourses: Course[] | null;
  openCheckout: (courses: Course[]) => void;
  closeCheckout: () => void;
  buyCourse: (course: Course) => Promise<boolean>;
  showNotification: (message: string, type?: 'success' | 'info' | 'warning') => void;
  notification: { message: string; type: 'success' | 'info' | 'warning' } | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [textSize, setTextSizeState] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [checkoutCourses, setCheckoutCourses] = useState<Course[] | null>(null);

  const pendingCourseIds = payments
    .filter(p => p.status === 'pending')
    .flatMap(p => p.items.map(i => i.courseId));

  // Load local preferences
  useEffect(() => {
    try {
      const savedSize = localStorage.getItem('llc_text_size') as 'normal' | 'large' | 'xlarge';
      if (savedSize) {
        setTextSizeState(savedSize);
        document.documentElement.setAttribute('data-text-size', savedSize);
      }

      const savedCart = localStorage.getItem('llc_cart');
      if (savedCart) setCart(JSON.parse(savedCart));

      const savedBookmarks = localStorage.getItem('llc_bookmarks');
      if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const setTextSize = (size: 'normal' | 'large' | 'xlarge') => {
    setTextSizeState(size);
    document.documentElement.setAttribute('data-text-size', size);
    try {
      localStorage.setItem('llc_text_size', size);
    } catch (e) {
      console.error(e);
    }
  };

  const showNotification = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(prev => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // Restore the session from the httpOnly cookie
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => setCurrentUser(data.user || null))
      .catch(err => console.error('Failed to load session:', err))
      .finally(() => setAuthReady(true));
  }, []);

  const login = async (email: string, password: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!data.success) return data.error || 'ចូលគណនីមិនបានទេ';
      setCurrentUser(data.user);
      showNotification(`សូមស្វាគមន៍ ${data.user.name}!`);
      return null;
    } catch {
      return 'មិនអាចភ្ជាប់ទៅម៉ាស៊ីនមេបានទេ';
    }
  };

  const signup = async (name: string, email: string, password: string, joinMembership: boolean): Promise<string | null> => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, joinMembership })
      });
      const data = await res.json();
      if (!data.success) return data.error || 'បង្កើតគណនីមិនបានទេ';
      setCurrentUser(data.user);
      showNotification(data.user.isMember ? 'បានបង្កើតគណនី និងចូលជាសមាជិក! ទទួលបានការបញ្ចុះតម្លៃ ១០%' : 'បានបង្កើតគណនីដោយជោគជ័យ!');
      return null;
    } catch {
      return 'មិនអាចភ្ជាប់ទៅម៉ាស៊ីនមេបានទេ';
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error(err);
    }
    setCurrentUser(null);
    setEnrollments([]);
    setPayments([]);
    setCheckoutCourses(null);
    showNotification('បានចាកចេញពីគណនី', 'info');
    router.push('/');
  };

  const requireLogin = (): boolean => {
    if (currentUser) return true;
    showNotification('សូមចូលគណនី ឬចុះឈ្មោះជាសមាជិកជាមុនសិន', 'info');
    setIsCartOpen(false);
    router.push(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    return false;
  };

  const refreshEnrollments = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/enrollments');
      const data = await res.json();
      if (data.success) {
        setEnrollments(data.enrollments);
      }
    } catch (err) {
      console.error('Failed to fetch enrollments:', err);
    }
  };

  const refreshPayments = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/payments');
      const data = await res.json();
      if (data.success) {
        setPayments(data.payments);
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    }
  };

  // Logout clears these itself, so only signed-in users need a fetch here
  useEffect(() => {
    if (!currentUser) return;
    refreshEnrollments();
    refreshPayments();
  }, [currentUser?.id]);

  const openCheckout = (courses: Course[]) => {
    if (!requireLogin()) return;
    const payable = courses.filter(
      c => c.price > 0 && !enrollments.some(e => e.courseId === c.id) && !pendingCourseIds.includes(c.id)
    );
    if (payable.length === 0) {
      showNotification('វគ្គនេះបានបង់ប្រាក់រួច ហើយកំពុងរង់ចាំការផ្ទៀងផ្ទាត់', 'info');
      return;
    }
    setIsCartOpen(false);
    setCheckoutCourses(payable);
  };

  const closeCheckout = () => setCheckoutCourses(null);

  const addToCart = (course: Course) => {
    if (enrollments.some(e => e.courseId === course.id)) {
      showNotification('You are already enrolled in this course!', 'info');
      return;
    }

    if (cart.some(item => item.courseId === course.id)) {
      showNotification('Course is already in your cart!', 'info');
      setIsCartOpen(true);
      return;
    }

    const updated = [...cart, { courseId: course.id, course, addedAt: new Date().toISOString() }];
    setCart(updated);
    try {
      localStorage.setItem('llc_cart', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    showNotification(`Added "${course.title}" to cart!`);
    setIsCartOpen(true);
  };

  // Functional update so several removals in a row (e.g. after checkout) all apply
  const removeFromCart = (courseId: string) => {
    setCart(prev => {
      const updated = prev.filter(item => item.courseId !== courseId);
      try {
        localStorage.setItem('llc_cart', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const clearCart = () => {
    setCart([]);
    try {
      localStorage.removeItem('llc_cart');
    } catch (e) {
      console.error(e);
    }
  };

  const enrollInCourse = async (course: Course): Promise<boolean> => {
    if (!requireLogin()) return false;
    try {
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: course.id })
      });
      const data = await res.json();
      if (data.success) {
        await refreshEnrollments();
        removeFromCart(course.id);
        showNotification(`Successfully enrolled in "${course.title}"! Welcome to class!`);
        return true;
      }
      if (data.paymentRequired) {
        openCheckout([course]);
      }
      return false;
    } catch (error) {
      console.error('Error enrolling:', error);
      showNotification('Enrollment failed. Please try again.', 'warning');
      return false;
    }
  };

  // Free courses enroll right away; paid courses open the bank payment popup.
  // Resolves true only when the student can start learning now.
  const buyCourse = async (course: Course): Promise<boolean> => {
    if (!requireLogin()) return false;
    if (enrollments.some(e => e.courseId === course.id)) return true;
    if (course.price === 0) return enrollInCourse(course);
    openCheckout([course]);
    return false;
  };

  const toggleBookmark = (courseId: string) => {
    const exists = bookmarks.includes(courseId);
    const updated = exists ? bookmarks.filter(id => id !== courseId) : [...bookmarks, courseId];
    setBookmarks(updated);
    try {
      localStorage.setItem('llc_bookmarks', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    showNotification(exists ? 'Removed from saved courses' : 'Saved to your learning list!');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        authReady,
        login,
        signup,
        logout,
        setCurrentUser,
        requireLogin,
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        textSize,
        setTextSize,
        bookmarks,
        toggleBookmark,
        enrollments,
        refreshEnrollments,
        enrollInCourse,
        payments,
        pendingCourseIds,
        refreshPayments,
        checkoutCourses,
        openCheckout,
        closeCheckout,
        buyCourse,
        showNotification,
        notification
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
