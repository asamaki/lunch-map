import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/map", "routes/map.tsx"),
  route("/restaurant/:id", "routes/restaurant.tsx"),
  route("/coming-soon", "routes/coming-soon.tsx"),
] satisfies RouteConfig;
