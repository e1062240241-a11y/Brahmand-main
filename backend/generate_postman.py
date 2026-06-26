import json
import uuid
import re

def main():
    # Load openapi.json
    try:
        with open("openapi.json", "r") as f:
            openapi = json.load(f)
    except FileNotFoundError:
        print("openapi.json not found. Please make sure to download it first.")
        return

    # Extract schema details
    info = openapi.get("info", {})
    title = info.get("title", "Brahmand API")
    description = info.get("description", "Postman Collection generated from FastAPI backend")
    version = info.get("version", "1.0.0")

    components_schemas = openapi.get("components", {}).get("schemas", {})

    # We will collect path parameters dynamically to initialize collection variables
    path_param_names = set()

    # Resolve schema to examples
    def resolve_schema_to_example(schema_obj, visited=None):
        if visited is None:
            visited = set()

        if not isinstance(schema_obj, dict):
            return None

        # Resolve references
        if "$ref" in schema_obj:
            ref_path = schema_obj["$ref"]
            ref_name = ref_path.split("/")[-1]
            if ref_name in visited:
                return f"CircularRef({ref_name})"
            visited.add(ref_name)
            resolved = components_schemas.get(ref_name, {})
            result = resolve_schema_to_example(resolved, visited)
            visited.remove(ref_name)
            return result

        # Handle allOf, anyOf, oneOf
        for key in ["allOf", "anyOf", "oneOf"]:
            if key in schema_obj and schema_obj[key]:
                if key == "allOf":
                    # Merge properties
                    merged_properties = {}
                    for sub in schema_obj[key]:
                        sub_resolved = resolve_schema_to_example(sub, visited)
                        if isinstance(sub_resolved, dict):
                            merged_properties.update(sub_resolved)
                    return merged_properties
                else:
                    # Just pick the first schema
                    return resolve_schema_to_example(schema_obj[key][0], visited)

        # Handle Object
        schema_type = schema_obj.get("type")
        if schema_type == "object" or "properties" in schema_obj:
            properties = schema_obj.get("properties", {})
            obj_result = {}
            for prop_name, prop_val in properties.items():
                obj_result[prop_name] = resolve_schema_to_example(prop_val, visited)
            return obj_result

        # Handle Array
        if schema_type == "array" or "items" in schema_obj:
            items_schema = schema_obj.get("items", {})
            item_example = resolve_schema_to_example(items_schema, visited)
            return [item_example]

        # Primitive type mapping
        default_val = schema_obj.get("default")
        example_val = schema_obj.get("example")
        enum_vals = schema_obj.get("enum")

        if example_val is not None:
            return example_val
        if default_val is not None:
            return default_val
        if enum_vals and len(enum_vals) > 0:
            return enum_vals[0]

        # Generic values based on type and title/description if possible
        if schema_type == "string":
            return "string"
        elif schema_type == "integer":
            return 0
        elif schema_type == "number":
            return 0.0
        elif schema_type == "boolean":
            return True
        return None

    # Custom example generator for more realistic fields
    def mock_value_for_field(name, resolved_val, schema_obj):
        name_lower = name.lower()
        schema_type = schema_obj.get("type") if isinstance(schema_obj, dict) else None

        if resolved_val == "string" or schema_type == "string":
            if "email" in name_lower:
                return "user@example.com"
            elif "phone" in name_lower:
                return "+919876543210"
            elif "otp" in name_lower:
                return "123456"
            elif "password" in name_lower:
                return "Password123!"
            elif "token" in name_lower:
                return "eyJhbGciOi..."
            elif "name" in name_lower:
                if "file" in name_lower or "path" in name_lower:
                    return "sample_file.png"
                return "John Doe"
            elif "title" in name_lower:
                return "Sample Title"
            elif "content" in name_lower or "text" in name_lower:
                return "This is sample text content."
            elif "description" in name_lower:
                return "This is a sample description."
            elif "caption" in name_lower:
                return "This is an awesome post!"
            elif "url" in name_lower or "link" in name_lower:
                return "https://example.com/image.jpg"
            elif "id" in name_lower:
                return f"{{{{{name.upper()}}}}}"
            return "string"

        elif resolved_val == 0 or schema_type in ["integer", "number"]:
            if "latitude" in name_lower:
                return 12.9716
            elif "longitude" in name_lower:
                return 77.5946
            elif "limit" in name_lower:
                return 10
            elif "skip" in name_lower or "offset" in name_lower:
                return 0
            elif "page" in name_lower:
                return 1
            elif "age" in name_lower:
                return 25
            return 0

        elif resolved_val is True or schema_type == "boolean":
            if "active" in name_lower or "enabled" in name_lower or "success" in name_lower:
                return True
            return False

        # If it's a list or dictionary, recurse
        if isinstance(resolved_val, dict):
            new_dict = {}
            for k, v in resolved_val.items():
                # Find the schema property object to get its details
                prop_schema = {}
                if isinstance(schema_obj, dict) and "properties" in schema_obj:
                    prop_schema = schema_obj["properties"].get(k, {})
                new_dict[k] = mock_value_for_field(k, v, prop_schema)
            return new_dict
        elif isinstance(resolved_val, list) and len(resolved_val) > 0:
            item_schema = {}
            if isinstance(schema_obj, dict) and "items" in schema_obj:
                item_schema = schema_obj["items"]
            return [mock_value_for_field(name, resolved_val[0], item_schema)]

        return resolved_val

    # Grouping logic
    def get_folder(path):
        if path.startswith("/api/admin"):
            return "Admin"
        elif path.startswith("/api/auth") or path.startswith("/auth"):
            return "Authentication"
        elif path.startswith("/api/posts/feed"):
            return "Feed"
        elif "upload" in path or path.startswith("/api/bunny-media"):
            return "Uploads"
        elif path.startswith("/api/posts") or path.startswith("/api/comments"):
            return "Posts"
        elif path.startswith("/api/messages/community"):
            return "Community Chat"
        elif path.startswith("/api/communities") or path.startswith("/api/community-requests"):
            return "Communities"
        elif path.startswith("/api/dm") or path.startswith("/api/messages/dm"):
            return "Direct Messages"
        elif path.startswith("/api/circles") or path.startswith("/api/messages/circle"):
            return "Circles"
        elif path.startswith("/api/user") or path.startswith("/api/users") or path.startswith("/user"):
            return "Users"
        elif path.startswith("/api/notifications"):
            return "Notifications"
        elif path.startswith("/api/temples") or path.startswith("/api/vendors"):
            return "Temples & Vendors"
        elif path.startswith("/api/library") or path.startswith("/api/jaap") or path.startswith("/api/spiritual") or path.startswith("/api/panchang") or path.startswith("/api/horoscope") or path.startswith("/api/astrology") or path.startswith("/api/wisdom"):
            return "Spiritual & Library"
        elif path.startswith("/api/sos") or path.startswith("/api/help-requests") or path.startswith("/api/blood-request"):
            return "Help & SOS & Blood Request"
        elif path.startswith("/api/events"):
            return "Events"
        elif path.startswith("/api/realtime"):
            return "Realtime & Agora"
        else:
            return "General & Other"

    # Set up basic folders dict
    folders = {
        "Authentication": [],
        "Users": [],
        "Communities": [],
        "Community Chat": [],
        "Circles": [],
        "Direct Messages": [],
        "Posts": [],
        "Feed": [],
        "Uploads": [],
        "Notifications": [],
        "Admin": [],
        "Temples & Vendors": [],
        "Spiritual & Library": [],
        "Help & SOS & Blood Request": [],
        "Events": [],
        "Realtime & Agora": [],
        "General & Other": []
    }

    # Iterate over all paths
    for path, methods in openapi.get("paths", {}).items():
        folder_name = get_folder(path)

        for method, info in methods.items():
            method_upper = method.upper()
            summary = info.get("summary", f"{method_upper} {path}")
            description = info.get("description", "")
            operation_id = info.get("operationId", "")

            # Path Variables and Query Parameters extraction
            path_params = []
            query_params = []
            header_params = []
            
            # Combine path/operation level parameters
            all_params = info.get("parameters", []) + openapi.get("paths", {}).get(path, {}).get("parameters", [])
            # Deduplicate by name and in
            seen_params = set()
            dedup_params = []
            for p in all_params:
                # resolve $ref parameter if present
                if "$ref" in p:
                    ref_path = p["$ref"]
                    ref_name = ref_path.split("/")[-1]
                    p = openapi.get("components", {}).get("parameters", {}).get(ref_name, p)
                
                key = (p.get("name"), p.get("in"))
                if key not in seen_params:
                    seen_params.add(key)
                    dedup_params.append(p)

            postman_variables = []
            postman_query = []
            postman_headers = []

            for param in dedup_params:
                p_name = param.get("name")
                p_in = param.get("in")
                p_desc = param.get("description", "")
                p_required = param.get("required", False)
                p_schema = param.get("schema", {})

                # Default/example value
                p_val = p_schema.get("default")
                if p_val is None:
                    p_val = p_schema.get("example")
                if p_val is None:
                    p_val = ""

                if p_in == "path":
                    # Path parameter
                    path_param_names.add(p_name)
                    postman_variables.append({
                        "key": p_name,
                        "value": f"{{{{{p_name.upper()}}}}}",
                        "description": p_desc
                    })
                elif p_in == "query":
                    # Query parameter
                    postman_query.append({
                        "key": p_name,
                        "value": str(p_val),
                        "description": p_desc,
                        "disabled": not p_required
                    })
                elif p_in == "header":
                    postman_headers.append({
                        "key": p_name,
                        "value": str(p_val),
                        "description": p_desc,
                        "type": "text"
                    })

            # Check if security is required for this operation
            # Default to true unless security is explicitly empty or 'HTTPBearer' is not in security requirements
            security = info.get("security", openapi.get("security"))
            requires_auth = True
            if security is not None:
                # If security is empty, e.g. [{}] or [], it means no auth
                if len(security) == 0 or (len(security) == 1 and not security[0]):
                    requires_auth = False
                else:
                    # Check if HTTPBearer (or other schemas) is required
                    requires_auth = any(bool(s) for s in security)
            else:
                # FastAPI default: check if path contains /auth or is the root API
                if folder_name == "Authentication" or path == "/api/" or path == "/api/health" or path == "/api/firebase-config":
                    requires_auth = False

            auth_obj = None
            if not requires_auth:
                auth_obj = {"type": "noauth"}

            # Request Body
            request_body = info.get("requestBody", {})
            body_obj = None
            
            if request_body:
                # Resolve ref
                if "$ref" in request_body:
                    ref_path = request_body["$ref"]
                    ref_name = ref_path.split("/")[-1]
                    request_body = openapi.get("components", {}).get("requestBodies", {}).get(ref_name, {})

                content = request_body.get("content", {})
                if "application/json" in content:
                    schema_obj = content["application/json"].get("schema", {})
                    resolved = resolve_schema_to_example(schema_obj)
                    mocked = mock_value_for_field("", resolved, schema_obj)
                    
                    body_obj = {
                        "mode": "raw",
                        "raw": json.dumps(mocked, indent=2),
                        "options": {
                            "raw": {
                                "language": "json"
                            }
                        }
                    }
                elif "multipart/form-data" in content:
                    schema_obj = content["multipart/form-data"].get("schema", {})
                    resolved = resolve_schema_to_example(schema_obj)
                    mocked = mock_value_for_field("", resolved, schema_obj)
                    
                    formdata = []
                    if isinstance(mocked, dict):
                        for k, v in mocked.items():
                            # Find if file property
                            prop_schema = {}
                            if isinstance(schema_obj, dict) and "properties" in schema_obj:
                                prop_schema = schema_obj["properties"].get(k, {})
                            
                            is_file = False
                            if isinstance(prop_schema, dict) and prop_schema.get("format") == "binary":
                                is_file = True
                            elif k in ["file", "image", "video", "audio", "photo", "document", "attachment"]:
                                is_file = True

                            if is_file:
                                formdata.append({
                                    "key": k,
                                    "type": "file",
                                    "src": []
                                })
                            else:
                                if isinstance(v, (dict, list)):
                                    v = json.dumps(v)
                                formdata.append({
                                    "key": k,
                                    "value": str(v) if v is not None else "",
                                    "type": "text"
                                })
                    body_obj = {
                        "mode": "formdata",
                        "formdata": formdata
                    }
                elif "application/x-www-form-urlencoded" in content:
                    schema_obj = content["application/x-www-form-urlencoded"].get("schema", {})
                    resolved = resolve_schema_to_example(schema_obj)
                    mocked = mock_value_for_field("", resolved, schema_obj)
                    
                    urlencoded = []
                    if isinstance(mocked, dict):
                        for k, v in mocked.items():
                            urlencoded.append({
                                "key": k,
                                "value": str(v) if v is not None else "",
                                "type": "text"
                            })
                    body_obj = {
                        "mode": "urlencoded",
                        "urlencoded": urlencoded
                    }

            # Response Examples
            responses = info.get("responses", {})
            postman_responses = []
            
            # Find the best success response (200 or 201)
            success_code = "200"
            if "200" not in responses and "201" in responses:
                success_code = "201"
            
            if success_code in responses:
                resp_info = responses[success_code]
                resp_desc = resp_info.get("description", "Success")
                resp_content = resp_info.get("content", {})
                resp_body = ""
                
                if "application/json" in resp_content:
                    resp_schema = resp_content["application/json"].get("schema", {})
                    resp_resolved = resolve_schema_to_example(resp_schema)
                    resp_mocked = mock_value_for_field("", resp_resolved, resp_schema)
                    resp_body = json.dumps(resp_mocked, indent=2)

                # Construct a realistic Postman example response
                # Replace path variables with dummy values in path segments for example URL
                url_path_segments = []
                for segment in path.strip("/").split("/"):
                    if segment.startswith("{") and segment.endswith("}"):
                        var_name = segment[1:-1]
                        url_path_segments.append(f":{var_name}")
                    else:
                        url_path_segments.append(segment)

                postman_responses.append({
                    "name": resp_desc,
                    "originalRequest": {
                        "method": method_upper,
                        "header": postman_headers,
                        "body": body_obj if body_obj else None,
                        "url": {
                            "raw": f"{{{{BASE_URL}}}}{path.replace('{', ':').replace('}', '')}",
                            "host": ["{{BASE_URL}}"],
                            "path": url_path_segments
                        }
                    },
                    "status": "OK" if success_code == "200" else "Created",
                    "code": int(success_code),
                    "_postman_previewlanguage": "json",
                    "header": [
                        {
                            "key": "Content-Type",
                            "value": "application/json"
                        }
                    ],
                    "cookie": [],
                    "body": resp_body
                })

            # Check if we should add a Test Script (JWT extraction)
            # Add JWT token extraction script if path contains 'login' or 'verify' or 'register'
            # and is under Authentication, Users, or Admin folder.
            event_obj = None
            is_login_endpoint = (
                "login" in path.lower() or 
                "verify" in path.lower() or 
                "register" in path.lower()
            ) and method_upper == "POST"

            if is_login_endpoint:
                event_obj = [
                    {
                        "listen": "test",
                        "script": {
                            "exec": [
                                "if (pm.response.code === 200 || pm.response.code === 201) {",
                                "    try {",
                                "        var jsonData = pm.response.json();",
                                "        var token = jsonData.access_token || jsonData.token || (jsonData.data && jsonData.data.token) || (jsonData.data && jsonData.data.access_token);",
                                "        if (token) {",
                                "            pm.collectionVariables.set(\"ACCESS_TOKEN\", token);",
                                "            console.log(\"Automatically saved ACCESS_TOKEN: \" + token);",
                                "        }",
                                "        var userId = jsonData.user_id || (jsonData.user && jsonData.user.id) || (jsonData.data && jsonData.data.user_id);",
                                "        if (userId) {",
                                "            pm.collectionVariables.set(\"USER_ID\", userId);",
                                "            console.log(\"Automatically saved USER_ID: \" + userId);",
                                "        }",
                                "    } catch (e) {",
                                "        console.error(\"Failed to extract JWT token: \", e);",
                                "    }",
                                "}"
                            ],
                            "type": "text/javascript"
                        }
                    }
                ]

            # Construct Postman URL
            # Format: /api/users/{user_id} -> /api/users/:user_id
            postman_path = path.replace("{", ":").replace("}", "")
            path_segments = [seg for seg in postman_path.strip("/").split("/") if seg]

            request_item = {
                "name": summary,
                "request": {
                    "method": method_upper,
                    "header": postman_headers,
                    "body": body_obj if body_obj else {
                        "mode": "raw",
                        "raw": ""
                    },
                    "url": {
                        "raw": f"{{{{BASE_URL}}}}{postman_path}" + ("?" + "&".join([f"{q['key']}={q['value']}" for q in postman_query]) if postman_query else ""),
                        "host": ["{{BASE_URL}}"],
                        "path": path_segments
                    }
                },
                "response": postman_responses
            }

            if auth_obj:
                request_item["request"]["auth"] = auth_obj
            if postman_query:
                request_item["request"]["url"]["query"] = postman_query
            if postman_variables:
                request_item["request"]["url"]["variable"] = postman_variables
            if event_obj:
                request_item["event"] = event_obj

            folders[folder_name].append(request_item)

    # Build collection items
    collection_items = []
    for f_name in [
        "Authentication", "Users", "Communities", "Community Chat", "Circles", 
        "Direct Messages", "Posts", "Feed", "Uploads", "Notifications", 
        "Admin", "Temples & Vendors", "Spiritual & Library", 
        "Help & SOS & Blood Request", "Events", "Realtime & Agora", "General & Other"
    ]:
        items_in_folder = folders.get(f_name, [])
        if items_in_folder:
            # Sort requests by name for better organization
            items_in_folder.sort(key=lambda x: x["name"])
            collection_items.append({
                "name": f_name,
                "item": items_in_folder
            })

    # Prepare variables
    collection_variables = [
        {"key": "BASE_URL", "value": "http://localhost:8000", "type": "string"},
        {"key": "ACCESS_TOKEN", "value": "", "type": "string"}
    ]
    for p_name in sorted(list(path_param_names)):
        collection_variables.append({
            "key": p_name.upper(),
            "value": f"placeholder_{p_name}",
            "type": "string"
        })

    # Final collection JSON structure
    collection = {
        "info": {
            "_postman_id": str(uuid.uuid4()),
            "name": title,
            "description": description,
            "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
        },
        "item": collection_items,
        "auth": {
            "type": "bearer",
            "bearer": [
                {
                    "key": "token",
                    "value": "{{ACCESS_TOKEN}}",
                    "type": "string"
                }
            ]
        },
        "variable": collection_variables
    }

    # Write to file
    with open("brahmand_postman_collection.json", "w") as f:
        json.dump(collection, f, indent=2)

    print("Successfully generated brahmand_postman_collection.json")
    print(f"Total folders created: {len(collection_items)}")
    total_endpoints = sum(len(f["item"]) for f in collection_items)
    print(f"Total endpoints included: {total_endpoints}")
    print(f"Dynamic variables created: {len(collection_variables)}")

if __name__ == "__main__":
    main()
