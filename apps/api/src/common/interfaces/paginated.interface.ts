/** Kết quả phân trang chuẩn cho mọi danh sách. */
export interface Paginated<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
