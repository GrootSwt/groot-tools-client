import { fetchDownload } from "@/assets/tools";
import { BaseService } from "../model";
import { postRequest } from "../request";
import { AxiosResponse } from "axios";

export type FileResponse = {
  id: string;
  originalName: string;
  createTime: Date;
  updateTime: Date;
  deleted: boolean;
};

class File extends BaseService {
  upload(data: FormData) {
    return postRequest(this.baseUrl + "/upload", data) as Promise<
      AxiosResponse<FileResponse>
    >;
  }
  async download(id: string, filename: string) {
    const res = await fetch(this.baseUrl + `/${id}/download`);
    const blob = await res.blob();
    fetchDownload(blob, filename);
  }
}
export default File;
