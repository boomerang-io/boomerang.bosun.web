import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import uuid from "uuid";
import { useQuery, useMutation, queryCache } from "react-query";
import { ToastNotification } from "carbon-components-react";
import { ErrorDragon, Loading } from "@boomerang-io/carbon-addons-boomerang-react";
import { toast } from "react-toastify";
import CreateEditPolicyForm from "Components/CreateEditPolicyForm";
import CreateEditPolicyHeader from "Components/CreateEditPolicyHeader";
import { serviceUrl, resolver } from "Config/servicesConfig";
import { POLICY_INTERACTION_TYPES } from "Constants";
import styles from "./editPolicy.module.scss";

EditPolicy.propTypes = {
  history: PropTypes.object,
  match: PropTypes.object
};

function EditPolicy ({ history, match }) {

  const [ errors, setErrors ] = useState({});
  const [ name, setName ] = useState("");

  const policiesUrl = serviceUrl.getPolicies();
  const policyUrl = serviceUrl.getPolicy({policyId: match.params.policyId});
  const validateInfoUrl = serviceUrl.getValidateInfo({policyId: match.params.policyId});

    /**
   * Transform the policy object into shape that can be read by the child form
   * @param {object} policy - policy to read in and create input state from
   * @param {array} definitionsData - definitionsData referenced in policy
   * @returns {object} - new state object for "inputs" key
   */
  const formatPolicyDataForForm = (policy, definitions)  => {
    const newInputsState = {};
    if(policy && definitions) {
      policy.definitions.forEach(definition => {
        const policyDefinition = definitionsData.find(
          policyDefinition => policyDefinition.id === definition.policyTemplateId
        );
        newInputsState[policyDefinition.key] = {};
        const definitionRows = newInputsState[policyDefinition.key];
        definition.rules.forEach(rule => {
          definitionRows[uuid.v4()] = rule;
        });
      });
    }
    return newInputsState;
  }

  const { data: definitionsData, isLoading: policiesIsLoading, error: policiesError } = useQuery({
    queryKey: policiesUrl,
    queryFn: resolver.query(policiesUrl),
    config: {
      onSuccess: (data) => setInputs(formatPolicyDataForForm(policyData, data))
    }
  });
  const { data: policyData, isLoading: policyIsLoading, error: policyError } = useQuery({
    queryKey: policyUrl,
    queryFn: resolver.query(policyUrl),
    config: {
      onSuccess: (data) => { 
        setInputs(formatPolicyDataForForm(data, definitionsData))
        setName(data.name)
      }
    }
  });
  const { data: validateInfoData, isLoading: validateInfoIsLoading, error: validateInfoError } = useQuery({
    queryKey: validateInfoUrl,
    queryFn: resolver.query(validateInfoUrl)
  });
  const [ inputs, setInputs ] = useState(formatPolicyDataForForm(policyData, definitionsData));

  const [updatePolicyMutation, { isLoading: isUpdating }] = useMutation(
    resolver.patchUpdatePolicy,
    {
      onSuccess: () => queryCache.invalidateQueries(policiesUrl),
    }
  );
  const [deletePolicyMutation, { isLoading: isDeleting }] = useMutation(
    resolver.deletePolicy,
    {
      onSuccess: () => queryCache.invalidateQueries(policiesUrl),
    }
  );

  const updatePolicy = async () => {
    let policyObject = {
      id: policyData.id,
      name: name,
      teamId: policyData.teamId,
      definitions: []
    };

    definitionsData.forEach(definition => {
      let newDefinition = {
        policyTemplateId: definition.id
      };
      let rules = [];
      const definitionRows = inputs[definition.key];
      for (let row in definitionRows) {
        rules.push(definitionRows[row]);
      }
      newDefinition["rules"] = rules;
      policyObject.definitions.push(newDefinition);
    });

    try {
      await updatePolicyMutation({body: policyObject, policyId: policyData.id});
      toast(
        <ToastNotification kind="success" title="Policy Updated" subtitle="Policy successfully updated" caption="" />
      );
      navigateBack();
    } catch (e) {
      toast(
        <ToastNotification
          kind="error"
          title="Something's Wrong"
          subtitle="Request to update policy failed"
          caption=""
        />
      );
    }
  };

  const deletePolicy = async () => {
    try {
      await deletePolicyMutation({policyId: policyData.id});
      toast(
        <ToastNotification
          kind="success"
          title="Policy deleted"
          subtitle={`Policy ${policyData.name} successfully deleted`}
          caption=""
        />
      );
      navigateBack();
    } catch (err) {
      const { data } = err && err.response;
      toast(
        <ToastNotification kind="error" title={`${data.status} - ${data.error}`} subtitle={data.message} caption="" />,
        {
          autoClose: 5000
        }
      );
    }
  };

  // State updates
  const setError = error => {
    setErrors(prevState => ({ ...prevState, ...error }));
  };

  const setInput = async ({ event: e, definitionKey, uuid }) => {
    const { name, value } = e.target;
    await setInputs(
      prevState => {
        const prevStateDefinitionRows = prevState[definitionKey] ? prevState[definitionKey][uuid] : {};
        return {
          ...prevState,
          [definitionKey]: {
            ...prevState[definitionKey],
            [uuid]: { ...prevStateDefinitionRows, [name]: value }
          }
        };
      }
    );
    validateRow(definitionKey)
  };

  const removeRow = async ({ definitionKey, uuid }) => {
    let definitionRows = { ...inputs[definitionKey] };
    if (definitionRows) {
      delete definitionRows[uuid];
      await setInputs(
        prevState => ({
         ...prevState, [definitionKey]: definitionRows
        })
      );
      validateRow(definitionKey)
    }
  };

  /**
   *
   * @param {definitionKey} - key reference to a definition type e.g. static_code_analysis
   */
  const validateRow = definitionKey => {
    const definitionRows = inputs[definitionKey] || {};
    const definitionRowsInputCount = Object.keys(definitionRows).reduce((accum, uuid) => {
      const inputCount = Object.values(definitionRows[uuid]).filter(Boolean).length;
      accum += inputCount;
      return accum;
    }, 0);

    // Each row should have the same number of inputs as the number of inputs in the policy definition rules
    const matchingDefintion = definitionsData.find(definition => definition.key === definitionKey);
    const isInvalid = Object.keys(definitionRows).length * matchingDefintion.rules.length !== definitionRowsInputCount;
    setErrors(prevState => ({ ...prevState, [definitionKey]: isInvalid }));
  };

  useEffect(() => {
    return function cleanup() {
      queryCache.removeQueries(policyUrl, {exact:true});
    }
  },[policyUrl]);
  
  // Local methods
  const navigateBack = () => {
    history.push(`/teams/${match.params.teamId}`);
  };

    if (policiesIsLoading || policyIsLoading || validateInfoIsLoading) {
      return <Loading />;
    }
    if (policiesError || policyError || validateInfoError) {
      return <ErrorDragon />;
    }

    if (policyData && definitionsData && validateInfoData) {
      const form = {
        name,
        inputs,
        errors,
        setName,
        setInput,
        setError,
        removeRow,
        validateRow,
        affirmativeAction: updatePolicy,
        deletePolicy,
        isPerformingAffirmativeAction: isUpdating,
        isDeleting
      };
      return (
        <div className={styles.container}>
          {(isDeleting || isUpdating) && <Loading />}
          <CreateEditPolicyHeader
            form={form}
            navigateBack={navigateBack}
            policy={policyData}
            type={POLICY_INTERACTION_TYPES.EDIT}
            validateInfo={validateInfoData}
          />
          <CreateEditPolicyForm form={form} definitions={definitionsData} />
        </div>
      );
    }

    return null;
}

export default EditPolicy;
