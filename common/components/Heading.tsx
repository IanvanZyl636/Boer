import React from 'react';
import PropTypes from 'prop-types';
import {View, Text, StyleSheet} from 'react-native';
import {textStyleSheet} from '../styles/text';

const Heading = ({
  children,
}: {
  children:
    | string
    | number
    | boolean
    | PropTypes.ReactElementLike
    | PropTypes.ReactNodeArray;
}) => {
  return (
    <View style={headingStyleSheet.container}>
      <Text style={textStyleSheet.headingText}>{children}</Text>
    </View>
  );
};

Heading.prototype = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
};

export default Heading;

const headingStyleSheet = StyleSheet.create({
  container: {padding: 10, backgroundColor: '#CECECE'},
});
