// see: https://www.npmjs.com/package/styled-components
import styled from "styled-components";


const BaseLayout = styled.div`
  margin: 0;
  padding: 5px;
  height: 100%;
  box-sizing: border-box;
`;

export const ContainerLayout = styled.div`
  height: 100%;
  display: flex;
  flex-direction: row;
`;

export const ContentLayout = styled.div`
  flex: 1;
  display: flex;
  flex-direction: row;
  margin: 0;
  padding: 0;
  height: 100%;
`;

export const WorkbenchLayout = styled(BaseLayout)`
  flex-basis: 100%;
`;

export const ChatAppLayout = styled(BaseLayout)`
  flex-basis: 33.33%;
  min-width: 400px;
  @media (max-width: 992px) {
    flex-basis: 100%;
  }
`;

export const ConsoleLayout = styled(BaseLayout)`
  flex-basis: 66.67%;
  min-width: 600px;
  // visible on only on large screens
  @media (max-width: 992px) {
    display: none;
    flex-basis: 0%;
  }
`;
