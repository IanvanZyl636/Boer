import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Button,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import {IBees} from './models/bees.model';
import {styles} from '../../common/styles/styles';

let isLoading: boolean,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
let beeste: IBees[], setBeeste: React.Dispatch<React.SetStateAction<IBees[]>>;
let filteredBeeste: IBees[],
  setFilteredBeeste: React.Dispatch<React.SetStateAction<IBees[]>>;
let isCreateBeesModalOpen: boolean,
  setIsCreateBeesModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
let deleteBeesModal: IBees | null,
  setDeleteBeesModal: React.Dispatch<React.SetStateAction<IBees | null>>;
let editBeesModal: IBees | null,
  setEditBeesModal: React.Dispatch<React.SetStateAction<IBees | null>>;
let errorModal: string | null,
  setErrorModal: React.Dispatch<React.SetStateAction<string | null>>;
let addBeesNumber: string | null,
  setAddBeesNumber: React.Dispatch<React.SetStateAction<string | null>>;
let addBeesWeight: string | null,
  setAddBeesWeight: React.Dispatch<React.SetStateAction<string | null>>;
let filter: string, setFilter: React.Dispatch<React.SetStateAction<string>>;

const addBees = async () => {
  try {
    if (!addBeesNumber || addBeesNumber === null) {
      setErrorModal('No bees number was entered');
      return;
    }

    if (!addBeesWeight || addBeesWeight === null) {
      setErrorModal('No bees weight was entered');
      return;
    }

    const doc = await firestore().collection('Beeste').doc(addBeesNumber).get();

    if (doc && doc.exists) {
      setErrorModal('Bees already exists');
      return;
    } else {
      await doc.ref.set({weight: addBeesWeight});
      setIsCreateBeesModalOpen(false);
      setAddBeesNumber(null);
      setAddBeesWeight(null);
      getBeeste();
      return;
    }
  } catch (error: any) {
    setErrorModal(error);
  }
};

const editBees = async (beesId: string) => {
  const doc = await firestore().collection('Beeste').doc(beesId).get();

  if (!doc || !doc.exists) {
    setErrorModal('Bees does not exist!');
    return;
  } else {
    await doc.ref.update({weight: addBeesWeight});
    setEditBeesModal(null);
    setAddBeesNumber(null);
    setAddBeesWeight(null);
    getBeeste();
    return;
  }
};

const deleteBees = async (beesId: string) => {
  const doc = await firestore().collection('Beeste').doc(beesId).get();

  if (!doc || !doc.exists) {
    setErrorModal('Bees does not exist!');
  }

  await doc.ref.delete();

  setDeleteBeesModal(null);
  getBeeste();
};

const getBeeste = async () => {
  try {
    setLoading(true);

    const snapshot = await firestore().collection('Beeste').get();
    const beesteC = snapshot.docs.map(doc => {
      return {id: doc.id, ...doc.data()} as IBees;
    });

    const orderBeeste = beesteC.sort((a, b) => {
      if (a.id > b.id) return 1;
      if (a.id < b.id) return -1;
      if (a.id === b.id) return 0;

      return 0;
    });

    setBeeste(orderBeeste);
    setFilteredBeeste(orderBeeste);
  } catch (error: any) {
    setErrorModal(error);
  } finally {
    setLoading(false);
  }
};

const BeesItem = ({item}: {item: IBees}) => {
  return (
    <TouchableOpacity
      onPress={() => {
        setAddBeesWeight(item.weight);
        setEditBeesModal(item);
      }}
      style={beestItemStyle.listItem}>
      <View style={beestItemStyle.staticSection}>
        <Text style={beestItemStyle.text}>{item.id}</Text>
      </View>
      <View style={beestItemStyle.growSection}>
        <Text style={[beestItemStyle.text, beestItemStyle.centerText]}>
          {item.weight} KG
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => setDeleteBeesModal(item)}
        style={[beestItemStyle.staticSection, beestItemStyle.deleteButton]}>
        <Text
          style={[beestItemStyle.centerText, beestItemStyle.deleteButtonText]}>
          -
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const changeFilter = (text: string) => {
  setFilter(text);

  if (!text) {
    setFilteredBeeste(beeste);
    return;
  }

  const filterBeeste = beeste.filter(bees => {
    return bees.id.indexOf(text) !== -1;
  });

  const orderBeeste = filterBeeste.sort((a, b) => {
    if (a.id > b.id) return 1;
    if (a.id < b.id) return -1;
    if (a.id === b.id) return 0;

    return 0;
  });

  setFilteredBeeste(orderBeeste);
};

const Beeste = () => {
  [isLoading, setLoading] = useState(true);
  [beeste, setBeeste] = useState([] as IBees[]);
  [filteredBeeste, setFilteredBeeste] = useState([] as IBees[]);
  [isCreateBeesModalOpen, setIsCreateBeesModalOpen] = useState(false);
  [editBeesModal, setEditBeesModal] = useState(null as IBees | null);
  [deleteBeesModal, setDeleteBeesModal] = useState(null as IBees | null);
  [errorModal, setErrorModal] = useState(null as string | null);

  [addBeesNumber, setAddBeesNumber] = useState(null as string | null);
  [addBeesWeight, setAddBeesWeight] = useState(null as string | null);
  [filter, setFilter] = useState('');

  useEffect(() => {
    getBeeste();
  }, []);

  return (
    <>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isCreateBeesModalOpen}>
        <View style={{flex: 1, backgroundColor: 'white'}}>
          <ScrollView>
            <Text style={{fontWeight: 'bold', color: 'black'}}>Create</Text>
            <Text style={{color: 'black'}}>Number:</Text>
            <TextInput
              keyboardType="numeric"
              style={styles.input}
              onChangeText={setAddBeesNumber}
              value={addBeesNumber ?? ''}
            />
            <Text style={{color: 'black'}}>Weight (KG):</Text>
            <TextInput
              keyboardType="numeric"
              style={styles.input}
              onChangeText={setAddBeesWeight}
              value={addBeesWeight ?? ''}
            />
          </ScrollView>
          <View style={{padding: 12}}>
            <Button onPress={addBees} title="Add" color="green" />
          </View>
          <View style={{padding: 12}}>
            <Button
              onPress={() => setIsCreateBeesModalOpen(false)}
              title="Cancel"
              color="#5895c7"
            />
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={deleteBeesModal !== null}>
        <View style={{flex: 1, backgroundColor: 'white'}}>
          <ScrollView>
            <Text style={{fontWeight: 'bold', color: 'black'}}>
              Are you sure you want to delete bees number {deleteBeesModal?.id}?
            </Text>
          </ScrollView>
          <View style={{padding: 12}}>
            <Button
              onPress={() => deleteBees(deleteBeesModal?.id as string)}
              title="Delete"
              color="red"
            />
          </View>
          <View style={{padding: 12}}>
            <Button
              onPress={() => setDeleteBeesModal(null)}
              title="Cancel"
              color="#5895c7"
            />
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={editBeesModal !== null}>
        <View style={{flex: 1, backgroundColor: 'white'}}>
          <ScrollView>
            <Text style={{fontWeight: 'bold', color: 'black'}}>Edit</Text>
            <Text style={{color: 'black'}}>Number: {editBeesModal?.id}</Text>
            <Text style={{color: 'black'}}>Weight (KG):</Text>
            <TextInput
              keyboardType="numeric"
              style={styles.input}
              onChangeText={setAddBeesWeight}
              value={addBeesWeight ?? ''}
            />
          </ScrollView>
          <View style={{padding: 12}}>
            <Button
              onPress={() => editBees(editBeesModal?.id as string)}
              title="Edit"
              color="orange"
            />
          </View>
          <View style={{padding: 12}}>
            <Button
              onPress={() => {
                setAddBeesWeight(null);
                setEditBeesModal(null);
              }}
              title="Cancel"
              color="#5895c7"
            />
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={errorModal !== null}
        onRequestClose={() => setErrorModal(null)}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text>Error</Text>
            <Text>{errorModal}</Text>
            <Button
              onPress={() => setErrorModal(null)}
              title="Close"
              color="#5895c7"
            />
          </View>
        </View>
      </Modal>

      <View style={{flex: 1}}>
        {isLoading ? (
          <ActivityIndicator />
        ) : (
          <>
            <TextInput
              keyboardType="numeric"
              style={styles.input}
              onChangeText={changeFilter}
              value={filter}
              placeholder="Filter..."
            />
            {filteredBeeste && filteredBeeste.length > 0 ? (
              <FlatList
                data={filteredBeeste}
                renderItem={BeesItem}
                keyExtractor={item => item.id}
              />
            ) : (
              <ScrollView>
                <Text>No Data</Text>
              </ScrollView>
            )}
            <View style={{padding: 12}}>
              <Button
                onPress={() => setIsCreateBeesModalOpen(true)}
                title="Add"
                color="green"
              />
            </View>
          </>
        )}
      </View>
    </>
  );
};

const beestItemStyle = StyleSheet.create({
  listItem: {
    borderBottomWidth: 1,
    borderStyle: 'solid',
    borderBottomColor: '#dadada',
    padding: 10,
    flex: 1,
    flexDirection: 'row',
  },
  staticSection: {flexGrow: 0, flexShrink: 0, flexWrap: 'nowrap'},
  growSection: {flexGrow: 1, flexShrink: 1, flexWrap: 'nowrap'},
  deleteButton: {aspectRatio: 1.5, backgroundColor: 'red', borderRadius: 5},
  text: {color: 'black', fontSize: 20},
  centerText: {textAlignVertical: 'center', textAlign: 'center'},
  deleteButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default Beeste;
