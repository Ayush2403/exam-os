import { onRequestDelete as __api_sync__roomId__js_onRequestDelete } from "/Users/ayushtomar/Documents/ExamOS-Backup/functions/api/sync/[roomId].js"
import { onRequestGet as __api_sync__roomId__js_onRequestGet } from "/Users/ayushtomar/Documents/ExamOS-Backup/functions/api/sync/[roomId].js"
import { onRequestOptions as __api_sync__roomId__js_onRequestOptions } from "/Users/ayushtomar/Documents/ExamOS-Backup/functions/api/sync/[roomId].js"
import { onRequestPost as __api_sync__roomId__js_onRequestPost } from "/Users/ayushtomar/Documents/ExamOS-Backup/functions/api/sync/[roomId].js"

export const routes = [
    {
      routePath: "/api/sync/:roomId",
      mountPath: "/api/sync",
      method: "DELETE",
      middlewares: [],
      modules: [__api_sync__roomId__js_onRequestDelete],
    },
  {
      routePath: "/api/sync/:roomId",
      mountPath: "/api/sync",
      method: "GET",
      middlewares: [],
      modules: [__api_sync__roomId__js_onRequestGet],
    },
  {
      routePath: "/api/sync/:roomId",
      mountPath: "/api/sync",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_sync__roomId__js_onRequestOptions],
    },
  {
      routePath: "/api/sync/:roomId",
      mountPath: "/api/sync",
      method: "POST",
      middlewares: [],
      modules: [__api_sync__roomId__js_onRequestPost],
    },
  ]