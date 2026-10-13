import { bindings, defineConfig } from "cf/config";


export default defineConfig({
	worker: {
		name: "duy",
		compatibilityDate: "2024-09-23",
		entrypoint: "src/worker.js",
		env: {
			DB: bindings.d1({
				name: "wedding-db",
				id: "493ea65f-2daf-422a-9d3a-b3744be0cb88",
			}),
			ASSETS: bindings.assets(),
		},
	},
});
