//---------------------------------------------------------------------------------
//  written by: Lawrence McDaniel
//              https://lawrencemcdaniel.com
//
//  date:       Mar-2024
//---------------------------------------------------------------------------------

// React stuff
import React, { useState, useEffect } from 'react';
import ReactJson from 'react-json-view';
import PropTypes from 'prop-types';

// This project
import { ConsoleLayout } from "../../components/Layout/";

// This component
import ConfigPropTypes from '../../types/propTypes';
import HelmetHeadStyles from "./HeadStyles"
import "./Component.css";
import { MenuItems } from './enums';


function Console({ config }) {

  const [consoleText, setConsoleText] = useState();
  const [chatToolCallHistory, setChatToolCallHistory] = useState();
  const [chatPluginUsageHistory, setChatPluginUsageHistory] = useState();
  const [chatbotRequestHistory, setChatbotRequestHistory] = useState();

  const [selectedMenuItem, setSelectedMenuItem] = useState(MenuItems.CHAT_CONFIG);

  // simulated bash shell environment
  const [podHash, setPodHash] = useState(Math.floor(Math.random() * 0xFFFFFFFF).toString(16));
  const [lastLogin, setLastLogin] = useState(new Date().toString());
  const [randomIpAddress, setRandomIpAddress] = useState(`192.168.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`);
  const [systemPrompt, setSystemPrompt] = useState(`smarter_user@smarter-${podHash}:~/smarter$`);


  // Lifecycle hooks
  useEffect(() => {
    if (config) {
      if (config.debug_mode) {
        console.log('Console() component mounted');
      }

      setChatToolCallHistory(config.history?.chat_tool_call_history || []);
      setChatPluginUsageHistory(config.history?.chat_plugin_usage_history || []);
      setChatbotRequestHistory(config.history?.chatbot_request_history || []);

      const newConsoleText = Array.isArray(config) ? config : [config] || [{}];
      setConsoleText(newConsoleText);
      setSelectedMenuItem(MenuItems.CHAT_CONFIG);
      }


    return () => {
      if (config?.debug_mode) {
        console.log('Console() component unmounted');
      }
    };

  }, [config]);


  const ConsoleNavItem = (props) => {

    // set the console output text based on the selected menu item
    function consoleNavItemClicked(event, id) {

      let newData = [{}];
      switch (id) {
        case MenuItems.CHAT_CONFIG:
          newData = Array.isArray(config) ? config : [config] || newData;
          break;
        case MenuItems.CHAT_TOOL_CALL_HISTORY:
          newData = chatToolCallHistory || newData;
          break;
        case MenuItems.CHAT_PLUGIN_USAGE_HISTORY:
          newData = chatPluginUsageHistory || newData;
          break;
        case MenuItems.CHATBOT_REQUEST_HISTORY:
          newData = chatbotRequestHistory || newData;
          break;
      }
      setSelectedMenuItem(id);
      setConsoleText(newData);

      // set the 'active' menu item
      requestAnimationFrame(() => {
        if (id != selectedMenuItem) {
          document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
        } else {
          event.target.classList.add('active');
        }
        });
    }

    return (
      <li className="nav-item my-1">
        <a
          id={props.id}
          className={`btn btn-sm btn-color-gray-600 bg-state-body btn-active-color-gray-800 fw-bolder fw-bold fs-6 fs-lg-base nav-link px-3 px-lg-4 mx-1 ${props.id === selectedMenuItem ? 'active' : ''}`}
          onClick={(event) => consoleNavItemClicked(event, props.id)}
        >
          {props.label}
        </a>
      </li>
    );
  };

  const ConsoleMenu = () => {
    return (
      <div
        id="chatapp_console"
        className="bg-gray-200 d-flex flex-stack flex-wrap mb-2 p-2 console-nav-items"
        data-kt-sticky="true"
        data-kt-sticky-name="sticky-profile-navs"
        data-kt-sticky-offset="{default: false, lg: '200px'}"
        data-kt-sticky-width="{target: '#kt_app_content_container'}"
        data-kt-sticky-left="auto"
        data-kt-sticky-top="70px"
        data-kt-sticky-animation="false"
        data-kt-sticky-zindex={95}
      >
        <ul className="nav flex-wrap border-transparent">
          <ConsoleNavItem label="Config" id={MenuItems.CHAT_CONFIG} />
          <ConsoleNavItem label="Api Calls" id={MenuItems.CHATBOT_REQUEST_HISTORY} />
          <ConsoleNavItem label="Tool Calls" id={MenuItems.CHAT_TOOL_CALL_HISTORY} />
          <ConsoleNavItem label="Plugin Usage" id={MenuItems.CHAT_PLUGIN_USAGE_HISTORY} />
        </ul>
      </div>
    );
  };

  const ConsoleOutputInitializing = () => {
    return (
      <div>
        <p className="mb-0">Last login: {lastLogin} from {randomIpAddress}</p>
        <p className="mb-0">{systemPrompt}</p>
      </div>
    );
  };

  const ConsoleScreen = () => {
    return (
      <div className="console-output rounded">
        <div className="console-output-content">
          <ConsoleOutputInitializing />
          {Array.isArray(consoleText) && consoleText.length === 1 && JSON.stringify(consoleText[0]) === '{}' ? null : (
            <>
              {Array.isArray(consoleText) ? consoleText.map((item, index) => (
                <ReactJson key={index} src={item} theme="monokai" />
              )) : null}
              <p className="mb-0">{systemPrompt}</p>
            </>
          )}
        </div>
      </div>
    );
  };


  return (
    <ConsoleLayout>
      <div className="console">
        <HelmetHeadStyles />
        {/*begin::Main*/}
        <div className="app-main flex-column flex-row-fluid" id="chatapp_console_app_main">
          {/*begin::Content wrapper*/}
          <div className="d-flex flex-column flex-column-fluid">
            {/*begin::Content*/}
            <div id="chatapp_console_app_content" className="app-content flex-column-fluid p-0 pb-5">
              {/*begin::Content container*/}
              <div
                id="chatapp_console_app_content_container"
                className="app-container container-xxl"
              >
                <ConsoleMenu />
                <ConsoleScreen />
              </div>
              {/*end::Content container*/}
            </div>
            {/*end::Content*/}
          </div>
          {/*end::Content wrapper*/}
        </div>
        {/*end:::Main*/}
      </div>
    </ConsoleLayout>
  );
}

Console.propTypes = {
  config: ConfigPropTypes,
};

export default Console;
