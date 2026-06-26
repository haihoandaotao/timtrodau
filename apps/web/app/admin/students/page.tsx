import { redirect } from 'next/navigation';

// Màn "Quản lý sinh viên" đã gộp vào "Quản lý người dùng & sinh viên".
export default function AdminStudentsRedirect() {
  redirect('/admin/users');
}
