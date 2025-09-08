  export interface ISearchData {
    message: string;
    results: {
      [bookTitle: string]: Array<{
        pageNum: number;
        text: string;
      }>;
    } | null;
    total: number;
  }
