
export async function load({ fetch }: { fetch: (input: RequestInfo, init?: 
    RequestInit) => Promise<Response> }): Promise<{ dataPdfSubjects: string[] }> {
    const response = await fetch('http://localhost:3001/api/subjects');
    const dataPdfSubjects: string[] = await response.json();
    return {
      dataPdfSubjects // Directly return the data, no "props" wrapper
    };
  }
  //when know of dataPdfSubjects structure, put that within.