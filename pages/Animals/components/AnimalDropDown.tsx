import {faCircleXmark} from '@fortawesome/free-solid-svg-icons/faCircleXmark';
import {faCircleCheck} from '@fortawesome/free-solid-svg-icons/faCircleCheck';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
} from 'react-native';
import {position, styles} from '../../../common/styles/styles';
import {AnimalTypeModel} from '../models/animalType.model';
import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import {
  merge,
  Observable,
  from,
  map,
  tap,
  switchMap,
  of,
  mergeMap,
  take,
} from 'rxjs';
import {camelize} from '../../../common/helpers/text.helper';
import Heading from '../../../common/components/Heading';

const collectionName = 'animalType';

const getAnimalTypeCollection$ = () =>
  from(firestore().collection(collectionName).get());

const getAnimalTypeDocument$ = (): Observable<
  | FirebaseFirestoreTypes.QueryDocumentSnapshot<FirebaseFirestoreTypes.DocumentData>
  | undefined
> => {
  return getAnimalTypeCollection$().pipe(
    take(1),
    map(animalTypeCollection => {
      const docs = animalTypeCollection.docs;

      if (docs.length === 0) {
        return undefined;
      }

      return docs[0];
    }),
  );
};

const getAnimalTypes$ = (): Observable<AnimalTypeModel[]> => {
  return getAnimalTypeDocument$().pipe(
    take(1),
    map(document => {
      if (!document) {
        return [];
      }

      return document.data().animalTypes as AnimalTypeModel[];
    }),
  );
};

const addAnimalType$ = (name: string) => {
  return getAnimalTypeDocument$().pipe(
    take(1),
    switchMap(document => {
      if (!document) {
        return of([]).pipe(take(1));
      }

      const animalTypes = (document.data().animalTypes ??
        []) as AnimalTypeModel[];
      const camelCaseName = camelize(name);
      const hasAnimalType =
        animalTypes.filter(animalType => animalType.id === camelCaseName)
          .length > 0;

      if (hasAnimalType) {
        return of(animalTypes).pipe(take(1));
      }

      return from(
        document.ref.set({
          animalTypes: [
            ...animalTypes,
            {id: camelCaseName, name} as AnimalTypeModel,
          ],
        }),
      ).pipe(
        mergeMap(() => getAnimalTypes$().pipe(take(1))),
        take(1),
      );
    }),
  );
};

const deleteAnimalType$ = (id: string) => {
  return getAnimalTypeDocument$().pipe(
    take(1),
    switchMap(document => {
      if (!document) {
        return of([]);
      }

      const animalTypes = (
        (document.data().animalTypes ?? []) as AnimalTypeModel[]
      ).filter(animalType => animalType.id !== id);

      return from(
        document.ref.set({
          animalTypes,
        }),
      ).pipe(
        mergeMap(() => getAnimalTypes$().pipe(take(1))),
        take(1),
      );
    }),
  );
};

const AnimalDropDown = () => {
  const [dropDownSearchText, setDropDownSearchText] = useState('');
  const [animals, setAnimals] = useState([] as AnimalTypeModel[]);
  const [selectedAnimalType, setSelectedAnimalType] = useState(
    undefined as AnimalTypeModel | undefined,
  );
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const MenuList = ({search}: {search: string}) => {
    const filteredAnimals = animals.filter(animal =>
      animal.name.toLowerCase().includes(search.toLowerCase()),
    );

    return filteredAnimals && filteredAnimals.length > 0 ? (
      <FlatList
        data={filteredAnimals}
        renderItem={({item}) => <MenuItem item={item} />}
        keyExtractor={item => item.id}
      />
    ) : (
      <Text>No Animals</Text>
    );
  };

  const MenuItem = ({item}: {item: AnimalTypeModel}) => {
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);

    const onDeleteAnimalType = (id: string) => {
      deleteAnimalType$(id)
        .pipe(
          tap(animalTypes => {
            if (id === selectedAnimalType?.id) {
              setSelectedAnimalType(undefined);
            }

            setAnimals(animalTypes);
          }),
        )
        .subscribe();
    };

    return (
      <View style={position.relative}>
        {!showConfirmDelete ? (
          <TouchableOpacity
            onPress={() => {
              return setSelectedAnimalType(item);
            }}
            style={menuItemStyle.listItem}>
            <View style={menuItemStyle.growSection}>
              <Text style={menuItemStyle.text}>{item.name}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowConfirmDelete(!showConfirmDelete)}
              style={menuItemStyle.staticSection}>
              <FontAwesomeIcon size={30} icon={faCircleXmark} color={'red'} />
            </TouchableOpacity>
          </TouchableOpacity>
        ) : (
          <View style={menuItemStyle.confirmDeleteContainer}>
            <View style={{flex: 1, marginRight: 2.5}}>
              <Text>
                Are you sure you want to delete {item.name} with all records
                listed underneath?
              </Text>
            </View>
            <View style={{flex: 0, marginRight: 2.5}}>
              <TouchableOpacity onPress={() => onDeleteAnimalType(item.id)}>
                <FontAwesomeIcon
                  size={30}
                  icon={faCircleCheck}
                  color={'green'}
                />
              </TouchableOpacity>
            </View>
            <View style={{flex: 0}}>
              <TouchableOpacity
                onPress={() => setShowConfirmDelete(!showConfirmDelete)}>
                <FontAwesomeIcon size={30} icon={faCircleXmark} color={'red'} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  const AddMenuItem = () => {
    const [addMode, setAddMode] = useState(false);
    const [animalName, setAnimalName] = useState(
      undefined as string | undefined,
    );

    const onAddMenuItem = () => {
      if (!animalName) {
        return;
      }

      addAnimalType$(animalName)
        .pipe(
          take(1),
          tap(animalTypes => {
            setAnimals(animalTypes);
            reset();
          }),
        )
        .subscribe();
    };

    const reset = () => {
      setAnimalName(undefined);
      setAddMode(false);
    };

    return (
      <>
        <Modal
          animationType="slide"
          visible={addMode}
          onRequestClose={() => setAddMode(!addMode)}>
          <Heading>Add Animal</Heading>
        </Modal>
        <View style={{padding: 12}}>
          <Button
            onPress={() => setAddMode(!addMode)}
            title="Add Animal"
            color="green"
          />
        </View>
      </>
    );
  };

  useEffect(() => {
    setLoading(true);

    const animalTypes$ = getAnimalTypes$().pipe(
      tap(animalTypes => setAnimals(animalTypes)),
    );

    const subscription = merge(animalTypes$).subscribe(() => setLoading(false));

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      <View>
        <TouchableOpacity onPress={() => setEditMode(!editMode)}>
          {!selectedAnimalType ? (
            <Heading>No Selected Animal</Heading>
          ) : (
            <Heading>{selectedAnimalType.name}</Heading>
          )}
        </TouchableOpacity>
      </View>
      {editMode ? (
        <View style={{flex: 1, backgroundColor: 'white'}}>
          <TextInput
            style={styles.input}
            placeholder="Search..."
            value={dropDownSearchText}
            onChangeText={setDropDownSearchText}
          />
          <View style={{flex: 1, backgroundColor: 'white'}}>
            {loading ? (
              <Text>Loading...</Text>
            ) : (
              <MenuList search={dropDownSearchText} />
            )}
          </View>
          <AddMenuItem />
        </View>
      ) : null}
    </>
  );
};

export default AnimalDropDown;

const menuItemStyle = StyleSheet.create({
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
  text: {color: 'black', fontSize: 20, textAlign: 'center'},
  centerText: {textAlignVertical: 'center', textAlign: 'center'},
  deleteButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  confirmDeleteContainer: {
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
    alignContent: 'center',
    justifyContent: 'center',
  },
});

const textInputButton = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 12.5,
    bottom: 0,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'nowrap',
  },
  button: {
    flex: 0,
    marginRight: 2.5,
  },
});
