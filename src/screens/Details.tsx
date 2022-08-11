import { useNavigation, useRoute } from "@react-navigation/native";
import { HStack, ScrollView, Text, useTheme, VStack } from "native-base";
import { useEffect, useState } from "react";
import { Header } from "../components/Header";
import { OrderProps } from "../components/Order";
import firestore from "@react-native-firebase/firestore";
import { OrderFirestoreDTO } from "../DTOs/OrderDTO";
import { dateFormat } from "../utils/firestoreDateFormat";
import { Loading } from "../components/Loading";
import { CircleWavyCheck, Hourglass, DesktopTower, Clipboard } from "phosphor-react-native";
import { CardDetails } from "../components/CardDetails";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { Alert } from "react-native";

type RouteParams = {
  orderId: string;
};

type OrderDetails = OrderProps & {
  description: string;
  solution?: string;
  closed: string;
};

export function Details() {
  const route = useRoute();
  const navigation = useNavigation();

  const { orderId } = route.params as RouteParams;

  const { colors } = useTheme();

  const [solution, setSolution] = useState("");

  const [order, setOrder] = useState<OrderDetails>({} as OrderDetails);
  const [isLoading, setIsLoading] = useState(true);

  function handleOrderClose() {
    if (!solution) {
      return Alert.alert('Solicitação', 'Informar a solução para encerrar a solicitação.')
    }

    firestore().collection<OrderFirestoreDTO>('orders').doc(orderId).update({
      status: 'closed',
      solution,
      closed_at: firestore.FieldValue.serverTimestamp()
    }).then(() => {
      Alert.alert('Solicitação', 'Solicitação encerrada.')
      navigation.goBack()
    }).catch((error) => {
      console.log(error);
      Alert.alert('Solicitação', 'Erro')
    })
  }

  useEffect(() => {
    firestore()
      .collection<OrderFirestoreDTO>("orders")
      .doc(orderId)
      .get()
      .then((doc) => {
        const {
          patrimony,
          description,
          solution,
          status,
          created_at,
          closed_at,
        } = doc.data();

        const closed = closed_at ? dateFormat(closed_at) : null;

        setOrder({
          id: doc.id,
          patrimony,
          description,
          status,
          solution,
          when: dateFormat(created_at),
          closed,
        });

        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <VStack flex={1} bg="gray.700">
      <Header title="Solicitação" />

      <HStack bg="gray.500" justifyContent="center" p={4}>
        {order.status === "closed" ? (
          <CircleWavyCheck size={22} color={colors.green[300]} />
        ) : (
          <Hourglass size={22} color={colors.secondary[700]} />
        )}

        <Text
          fontSize="sm"
          color={
            order.status === "closed"
              ? colors.green[300]
              : colors.secondary[700]
          }
          ml={2}
          textTransform="uppercase"
        >
          {order.status === "closed" ? "finalizado" : "em andamento"}
        </Text>
      </HStack>

      <ScrollView mx={5} showsVerticalScrollIndicator={false}>
        <CardDetails title="equipamento" description={`Patrimônio ${order.patrimony}`} icon={DesktopTower} footer={order.when} />


        <CardDetails title="descrição do problema" description={order.description} icon={Clipboard} />


        <CardDetails title="solução" icon={CircleWavyCheck} footer={order.closed && `Encerrado em ${order.closed}`} >
          <Input placeholder="Descrição" onChangeText={setSolution} h={24} textAlignVertical="top" multiline />
        </CardDetails>



      </ScrollView>
      {
        order.status === 'open' &&

        <Button title="Encerrar solicitação" ml={5} mr={5} mb={5} mt={5} onPress={handleOrderClose}/>

      }
    </VStack>
  );
}
