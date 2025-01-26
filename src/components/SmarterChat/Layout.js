// see: https://www.npmjs.com/package/styled-components
import styled from "styled-components";

export const ContainerLayout = styled.div`
  height: 89vh;
  display: flex;
  flex-direction: row;
`;

export const ContentLayout = styled.div`
  flex: 1;
  display: flex;
  flex-direction: row;
  margin: 0;
  padding: 0;
`;

export const ComponentLayout = styled.div`
  flex-basis: 33.33%;
  margin: 0;
  padding: 5px;
  @media (max-width: 992px) {
    flex-basis: 100%;
  }
`;

