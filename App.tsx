import React from 'react';
import {SafeAreaView} from 'react-native';
import AnimalDropDown from './pages/Animals/components/AnimalDropDown';
import Beeste from './pages/Beeste/Beeste';

const App = () => {
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: 'yellow'}}>
      {/* <Beeste></Beeste> */}
      <AnimalDropDown></AnimalDropDown>
    </SafeAreaView>
  );
};

export default App;
