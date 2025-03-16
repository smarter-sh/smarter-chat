import PropTypes from 'prop-types';

const AccountPropTypes = PropTypes.shape({
  account_number: PropTypes.string,
});

const ChatbotPropTypes = PropTypes.shape({
  id: PropTypes.number,
  account: AccountPropTypes,
  name: PropTypes.string,
  description: PropTypes.string,
  version: PropTypes.string,
  subdomain: PropTypes.string,
  custom_domain: PropTypes.string,
  deployed: PropTypes.bool,
  provider: PropTypes.string,
  default_model: PropTypes.string,
  default_system_role: PropTypes.string,
  default_temperature: PropTypes.number,
  default_max_tokens: PropTypes.number,
  app_name: PropTypes.string,
  app_assistant: PropTypes.string,
  app_welcome_message: PropTypes.string,
  app_example_prompts: PropTypes.arrayOf(PropTypes.string),
  app_placeholder: PropTypes.string,
  app_info_url: PropTypes.string,
  app_background_image_url: PropTypes.string,
  app_logo_url: PropTypes.string,
  app_file_attachment: PropTypes.bool,
  dns_verification_status: PropTypes.string,
  url_chatbot: PropTypes.string,
});

const ChatPropTypes = PropTypes.shape({
  id: PropTypes.number,
  created_at: PropTypes.string,
  updated_at: PropTypes.string,
  session_key: PropTypes.string,
  ip_address: PropTypes.string,
  user_agent: PropTypes.string,
  url: PropTypes.string,
  account: PropTypes.number,
  chatbot: PropTypes.number,
});

const ChatHistoryPropTypes = PropTypes.arrayOf(PropTypes.shape({
  role: PropTypes.string,
  content: PropTypes.string,
  smarter_is_new: PropTypes.bool,
}));

const ChatbotRequestHistory = PropTypes.arrayOf(PropTypes.shape({
  id: PropTypes.number,
  created_at: PropTypes.string,
  updated_at: PropTypes.string,
  request: PropTypes.shape({
    messages: PropTypes.arrayOf(PropTypes.shape({
      role: PropTypes.string,
      content: PropTypes.string,
    })),
    session_key: PropTypes.string,
  }),
  is_aggregation: PropTypes.bool,
}));

const MetadataPropTypes = PropTypes.shape({
  url: PropTypes.string,
  session_key: PropTypes.string,
  data: PropTypes.object,
  chatbot_id: PropTypes.number,
  chatbot_name: PropTypes.string,
  is_smarter_api: PropTypes.bool,
  is_chatbot: PropTypes.bool,
  is_chatbot_smarter_api_url: PropTypes.bool,
  is_chatbot_named_url: PropTypes.bool,
  is_chatbot_sandbox_url: PropTypes.bool,
  is_chatbot_cli_api_url: PropTypes.bool,
  is_default_domain: PropTypes.bool,
  path: PropTypes.string,
  root_domain: PropTypes.string,
  subdomain: PropTypes.string,
  api_subdomain: PropTypes.string,
  domain: PropTypes.string,
  user: PropTypes.string,
  account: PropTypes.string,
  timestamp: PropTypes.string,
  unique_client_string: PropTypes.string,
  client_key: PropTypes.string,
  ip_address: PropTypes.string,
  user_agent: PropTypes.string,
  parsed_url: PropTypes.object,
  environment: PropTypes.string,
  environment_api_domain: PropTypes.string,
  is_deployed: PropTypes.bool,
  is_valid: PropTypes.bool,
  error: PropTypes.string,
  is_authentication_required: PropTypes.bool,
  name: PropTypes.string,
  chatbot: ChatbotPropTypes,
  api_host: PropTypes.string,
  is_custom_domain: PropTypes.bool,
  chatbot_custom_domain: PropTypes.string,
});

const HistoryPropTypes = PropTypes.shape({
  chat: ChatPropTypes,
  chat_history: ChatHistoryPropTypes,
  chat_tool_call_history: PropTypes.arrayOf(PropTypes.object),
  chat_plugin_usage_history: PropTypes.arrayOf(PropTypes.object),
  chatbot_request_history: ChatbotRequestHistory,
  plugin_selector_history: PropTypes.arrayOf(PropTypes.object),
});

const PluginPropTypes = PropTypes.arrayOf(PropTypes.shape({
  id: PropTypes.number,
  plugin_meta: PropTypes.shape({
    name: PropTypes.string,
    account: AccountPropTypes,
    description: PropTypes.string,
    pluginClass: PropTypes.string,
    version: PropTypes.string,
    author: PropTypes.shape({
      user: PropTypes.shape({
        username: PropTypes.string,
        email: PropTypes.string,
      }),
      account: AccountPropTypes,
    }),
    tags: PropTypes.arrayOf(PropTypes.string),
  }),
  created_at: PropTypes.string,
  updated_at: PropTypes.string,
  chatbot: PropTypes.number,
}));

const PluginsPropTypes = PropTypes.shape({
  meta_data: PropTypes.shape({
    total_plugins: PropTypes.number,
    plugins_returned: PropTypes.number,
  }),
  plugins: PluginPropTypes,
});

const ConfigPropTypes = PropTypes.shape({
  debug_mode: PropTypes.bool,
  sandbox_mode: PropTypes.bool,
  session_key: PropTypes.string,
  chatbot: ChatbotPropTypes,
  history: HistoryPropTypes,
  meta_data: MetadataPropTypes,
  plugins: PluginsPropTypes,
});

export default ConfigPropTypes;
